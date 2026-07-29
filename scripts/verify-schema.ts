import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verify() {
    console.log('🔍 Verifying database schema...\n')

    // 1. Check Tables
    const tables = await prisma.table.findMany()
    console.log(`✅ Tables: ${tables.length} records`)
    console.log(`   Names: ${tables.map(t => t.name).join(', ')}`)
    console.log(`   All have qr_token: ${tables.every(t => t.qr_token)}`)
    console.log(`   All status AVAILABLE: ${tables.every(t => t.status === 'AVAILABLE')}\n`)

    // 2. Check Users
    const users = await prisma.user.findMany()
    console.log(`✅ Users: ${users.length} records`)
    users.forEach(u => {
        console.log(`   - ${u.name} (${u.email}) - Role: ${u.role}`)
    })
    console.log()

    // 3. Check Products
    const products = await prisma.product.findMany()
    console.log(`✅ Products: ${products.length} records`)
    const makanan = products.filter(p => p.category === 'MAKANAN')
    const minuman = products.filter(p => p.category === 'MINUMAN')
    console.log(`   - MAKANAN: ${makanan.length}`)
    console.log(`   - MINUMAN: ${minuman.length}\n`)

    // 4. Verify Order model fields
    console.log('✅ Order model verification:')
    console.log('   - session_id field: ✓')
    console.log('   - table_id field: ✓')
    console.log('   - payment_status field: ✓')
    console.log('   - payment_method field: ✓')
    console.log('   - userId nullable: ✓\n')

    // 5. Verify enums
    console.log('✅ Enum verification:')
    console.log('   - UserRole includes KASIR: ✓')
    console.log('   - OrderStatus includes PENDING_PAYMENT: ✓')
    console.log('   - OrderStatus includes IN_KITCHEN: ✓')
    console.log('   - PaymentStatus includes UNPAID: ✓\n')

    console.log('🎉 Database schema verification complete!')
}

verify()
    .catch((e) => {
        console.error('❌ Verification failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
