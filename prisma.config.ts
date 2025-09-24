import path from 'node:path';
import type { PrismaConfig } from 'prisma';

console.log(path);

export default {
    schema: path.join('src/prisma/'),
} satisfies PrismaConfig;
