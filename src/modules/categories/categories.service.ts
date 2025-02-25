import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository } from 'typeorm';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import slugify from 'slugify';
import { Category } from './entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto, CategoryTreeDto } from './dto/category.dto';
import { SearchResponse, SearchHit } from '@elastic/elasticsearch/lib/api/types';

@Injectable()
export class CategoriesService {
  private readonly indexName = 'categories';

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Category)
    private readonly treeRepository: TreeRepository<Category>,
    private readonly elasticsearchService: ElasticsearchService,
  ) {
    this.createIndex();
  }

  private async createIndex() {
    try {
      const checkIndex = await this.elasticsearchService.indices.exists({
        index: this.indexName,
      });

      if (!checkIndex) {
        await this.elasticsearchService.indices.create({
          index: this.indexName,
          body: {
            mappings: {
              properties: {
                id: { type: 'keyword' },
                name: { type: 'text' },
                slug: { type: 'keyword' },
                description: { type: 'text' },
                isActive: { type: 'boolean' },
                parentId: { type: 'keyword' },
                path: { type: 'keyword' },
                createdAt: { type: 'date' },
              },
            },
          },
        });
      }
    } catch (error) {
      console.error("Error creating index:", error);
    }
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const slug = createCategoryDto.slug ||
      slugify(createCategoryDto.name, { lower: true, strict: true });

    const existingCategory = await this.categoryRepository.findOne({
      where: { slug },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this slug already exists');
    }

    const category = this.categoryRepository.create({
      ...createCategoryDto,
      slug,
    });

    if (createCategoryDto.parentId) {
      const parent = await this.findOne(createCategoryDto.parentId);
      category.parent = parent;
    }

    const savedCategory = await this.categoryRepository.save(category);
    await this.indexCategory(savedCategory);

    return savedCategory;
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    if (updateCategoryDto.name && !updateCategoryDto.slug) {
      updateCategoryDto.slug = slugify(updateCategoryDto.name, { lower: true, strict: true });
    }

    if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { slug: updateCategoryDto.slug },
      });

      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException('Category with this slug already exists');
      }
    }

    if (updateCategoryDto.parentId) {
      const parent = await this.findOne(updateCategoryDto.parentId);
      if (parent.id === category.id) {
        throw new ConflictException('Category cannot be its own parent');
      }
      category.parent = parent;
    }

    Object.assign(category, updateCategoryDto);
    const updatedCategory = await this.categoryRepository.save(category);
    await this.indexCategory(updatedCategory);

    return updatedCategory;
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
    await this.elasticsearchService.delete({
      index: this.indexName,
      id,
    });
  }

  async getTree(): Promise<CategoryTreeDto[]> {
    const trees = await this.treeRepository.findTrees();
    return this.mapTreesToDto(trees);
  }

  async move(id: string, newParentId: string): Promise<Category> {
    const category = await this.findOne(id);
    const newParent = await this.findOne(newParentId);

    if (await this.isDescendant(newParent, category)) {
      throw new ConflictException('Cannot move category to its descendant');
    }

    category.parent = newParent;
    const updatedCategory = await this.categoryRepository.save(category);
    await this.indexCategory(updatedCategory);

    return updatedCategory;
  }

  async search(query: string): Promise<Category[]> {
    const response = await this.elasticsearchService.search<SearchResponse<Category>>({ // Correcto
      index: this.indexName,
      body: {
        query: {
          multi_match: {
            query,
            fields: ['name', 'description'],
            fuzziness: 'AUTO',
          },
        },
      },
    });

    // CORRECCIÓN: El tipado del map
    const categories = response.hits.hits.map((hit: SearchHit<Category>) => hit._source!);
    return categories;
  }


  private async isDescendant(possibleDescendant: Category, ancestor: Category): Promise<boolean> {
    const descendants = await this.treeRepository.findDescendants(ancestor);
    return descendants.some(d => d.id === possibleDescendant.id);
  }

  private async indexCategory(category: Category) {
    const ancestors = await this.treeRepository.findAncestors(category);
    const path = ancestors.map(a => a.slug).join('/');

    await this.elasticsearchService.index({
      index: this.indexName,
      id: category.id,
      body: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        isActive: category.isActive,
        parentId: category.parent?.id,
        path: path ? `${path}/${category.slug}` : category.slug,
        createdAt: category.createdAt,
      },
    });
  }

  private mapTreesToDto(trees: Category[]): CategoryTreeDto[] {
    return trees.map(tree => ({
      id: tree.id,
      name: tree.name,
      slug: tree.slug,
      description: tree.description,
      icon: tree.icon,
      image: tree.image,
      isActive: tree.isActive,
      metadata: tree.metadata,
      children: tree.children ? this.mapTreesToDto(tree.children) : undefined,
    }));
  }
}