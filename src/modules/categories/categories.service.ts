import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository, ILike } from 'typeorm'; // Importa ILike
import slugify from 'slugify';
import { Category } from './entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto, CategoryTreeDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Category)
    private readonly treeRepository: TreeRepository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent'], // Carga la relación con el padre
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    if (updateCategoryDto.name && !updateCategoryDto.slug) {
      updateCategoryDto.slug = slugify(updateCategoryDto.name, { lower: true, strict: true });
    }
    //Comprobación del slug
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
    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id); // Esto ya lanza si no existe
    await this.categoryRepository.remove(category);
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
    return this.categoryRepository.save(category);
  }

  async search(query: string): Promise<Category[]> {
    return this.categoryRepository.find({
      where: [
        { name: ILike(`%${query}%`) },
        { description: ILike(`%${query}%`) },
      ],
    });
  }

  private async isDescendant(possibleDescendant: Category, ancestor: Category): Promise<boolean> {
    const descendants = await this.treeRepository.findDescendants(ancestor);
    return descendants.some(d => d.id === possibleDescendant.id);
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

  async initialize(): Promise<void> {
    // Implement any initialization logic here
    this.logger.log('CategoriesService initialized');
  }
}
