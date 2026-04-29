import 'dotenv/config'; // Додай цей рядок першим
import path from 'node:path';
import type { PrismaConfig } from 'prisma';

export default {
    // Вказуємо шлях саме до файлу схеми, а не просто папки
    schema: path.join(process.cwd(), 'src/prisma/schema.prisma'),
} satisfies PrismaConfig;
