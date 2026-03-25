import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoriesRepository.create(createCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: { activa: true },
      order: { nombre: 'ASC' },
    });
  }

  async findById(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findById(id);
    Object.assign(category, updateCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async remove(id: string): Promise<{ message: string }> {
    const category = await this.findById(id);
    await this.categoriesRepository.remove(category);
    return { message: 'Categoría eliminada exitosamente' };
  }

  async deactivate(id: string): Promise<Category> {
    const category = await this.findById(id);
    category.activa = false;
    return this.categoriesRepository.save(category);
  }

  async activate(id: string): Promise<Category> {
    const category = await this.findById(id);
    category.activa = true;
    return this.categoriesRepository.save(category);
  }

  async createDefaultCategories(): Promise<Category[]> {
    const defaultCategories = [
      {
        nombre: 'Alimentación',
        descripcion: 'Gastos en comida y bebidas',
        color: '#FF6B6B',
        icono: 'fas fa-utensils',
      },
      {
        nombre: 'Transporte',
        descripcion: 'Gasolina, transporte público, taxi',
        color: '#4ECDC4',
        icono: 'fas fa-car',
      },
      {
        nombre: 'Entretenimiento',
        descripcion: 'Cine, música, juegos',
        color: '#FFE66D',
        icono: 'fas fa-film',
      },
      {
        nombre: 'Salud',
        descripcion: 'Medicinas, doctor, gym',
        color: '#95E1D3',
        icono: 'fas fa-heartbeat',
      },
      {
        nombre: 'Educación',
        descripcion: 'Cursos, libros, capacitación',
        color: '#A8E6CF',
        icono: 'fas fa-graduation-cap',
      },
      {
        nombre: 'Vivienda',
        descripcion: 'Arriendo, servicios, mantenimiento',
        color: '#C7CEEA',
        icono: 'fas fa-home',
      },
      {
        nombre: 'Compras',
        descripcion: 'Ropa, electrodomésticos',
        color: '#FFB7B2',
        icono: 'fas fa-shopping-bag',
      },
      {
        nombre: 'Otros',
        descripcion: 'Gastos diversos',
        color: '#10B981',
        icono: 'fas fa-ellipsis-h',
      },
    ];

    const existingCategories = await this.categoriesRepository.find();
    if (existingCategories.length === 0) {
      return this.categoriesRepository.save(defaultCategories);
    }

    return existingCategories;
  }
}
