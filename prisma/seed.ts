import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting seed...')

    // 1. Create Tables and TAKEAWAY QR Code
    console.log('Creating tables...')
    const tables = [
        { name: '1', qr_token: crypto.randomBytes(32).toString('hex') },
        { name: '2', qr_token: crypto.randomBytes(32).toString('hex') },
        { name: '3', qr_token: crypto.randomBytes(32).toString('hex') },
        { name: '4', qr_token: crypto.randomBytes(32).toString('hex') },
        { name: '5', qr_token: crypto.randomBytes(32).toString('hex') },
        { name: '6', qr_token: crypto.randomBytes(32).toString('hex') },
        { name: '7', qr_token: crypto.randomBytes(32).toString('hex') },
        { name: '8', qr_token: crypto.randomBytes(32).toString('hex') },
        { name: '9', qr_token: crypto.randomBytes(32).toString('hex') },
        { name: '10', qr_token: crypto.randomBytes(32).toString('hex') },
        { name: 'TAKEAWAY', qr_token: crypto.randomBytes(32).toString('hex') }, // QR code for takeaway orders
    ]

    await prisma.table.createMany({
        data: tables,
        skipDuplicates: true,
    })

    console.log(`✅ Created 10 dine-in tables + 1 TAKEAWAY QR code`)


    // 2. Create Users (Admin, Kasir, and Owner)
    console.log('Creating users...')
    const adminPassword = await bcrypt.hash('admin123', 10)
    const kasirPassword = await bcrypt.hash('kasir123', 10)
    const ownerPassword = await bcrypt.hash('owner123', 10)

    await prisma.user.createMany({
        data: [
            {
                id: 'clx00000000000000000000001',
                email: 'admin@resto.com',
                name: 'Admin Resto',
                password: adminPassword,
                role: 'ADMIN',
            },
            {
                id: 'clx00000000000000000000002',
                email: 'kasir@resto.com',
                name: 'Kasir Staff',
                password: kasirPassword,
                role: 'KASIR',
            },
            {
                id: 'clx00000000000000000000003',
                email: 'owner@resto.com',
                name: 'Owner Resto',
                password: ownerPassword,
                role: 'OWNER',
            },
        ],
        skipDuplicates: true,
    })

    // 2. Create Products
    console.log('Creating products...')
    await prisma.product.createMany({
        data: [
            {
                id: 'clx00000000000000000000011',
                name: 'Iga Bakar Madu',
                description: 'Iga bakar dengan bumbu madu yang manis dan gurih',
                price: 85000,
                category: 'MAKANAN',
                stock: 50,
                isActive: true,
            },
            {
                id: 'clx00000000000000000000012',
                name: 'Iga Bakar Spesial',
                description: 'Iga bakar dengan bumbu rahasia, sangat empuk dan juicy',
                price: 95000,
                category: 'MAKANAN',
                stock: 45,
                isActive: true,
            },
            {
                id: 'clx00000000000000000000013',
                name: 'Iga Bakar Pedas',
                description: 'Iga bakar dengan level pedas yang bisa disesuaikan',
                price: 90000,
                category: 'MAKANAN',
                stock: 40,
                isActive: true,
            },
            {
                id: 'clx00000000000000000000014',
                name: 'Iga Bakar BBQ',
                description: 'Iga bakar dengan saus BBQ ala Amerika, smoky dan lezat',
                price: 100000,
                category: 'MAKANAN',
                stock: 35,
                isActive: true,
            },
            {
                id: 'clx00000000000000000000015',
                name: 'Iga Bakar Kecap',
                description: 'Iga bakar dengan bumbu kecap manis, khas Indonesia',
                price: 80000,
                category: 'MAKANAN',
                stock: 55,
                isActive: true,
            },
            {
                id: 'clx00000000000000000000019',
                name: 'Es Teh Manis',
                description: 'Es teh manis segar',
                price: 8000,
                category: 'MINUMAN',
                stock: 100,
                isActive: true,
            },
            {
                id: 'clx00000000000000000000020',
                name: 'Es Jeruk',
                description: 'Es jeruk peras',
                price: 10000,
                category: 'MINUMAN',
                stock: 80,
                isActive: true,
            },
            {
                id: 'clx00000000000000000000021',
                name: 'Jus Alpukat',
                description: 'Jus alpukat segar dengan susu',
                price: 15000,
                category: 'MINUMAN',
                stock: 60,
                isActive: true,
            },
        ],
        skipDuplicates: true,
    })

    console.log('Creating default system settings...')
    await prisma.systemSetting.createMany({
        data: [
            { key: 'restaurant_name', value: 'Iga Bakar Ombenk' },
            { key: 'logo_url', value: '/logo-v3.png' },
            { key: 'background_url', value: '/restaurant-bg.jpg' },
        ],
        skipDuplicates: true,
    })

    console.log('✅ Seed completed successfully!')
    console.log('\n📝 Default credentials:')
    console.log('Owner: owner@resto.com / owner123')
    console.log('Admin: admin@resto.com / admin123')
    console.log('Kasir: kasir@resto.com / kasir123')
    console.log('\n🏠 Tables created: 1-10')
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
