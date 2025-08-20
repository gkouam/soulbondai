const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function ensureAdminRole() {
  const adminEmail = 'kouam7@gmail.com'
  
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: adminEmail }
    })
    
    if (!user) {
      console.log(`User ${adminEmail} not found`)
      return
    }
    
    console.log(`Current role for ${adminEmail}: ${user.role}`)
    
    // Update to ADMIN if not already
    if (user.role !== 'ADMIN') {
      const updated = await prisma.user.update({
        where: { email: adminEmail },
        data: { role: 'ADMIN' }
      })
      console.log(`Updated ${adminEmail} role to ADMIN`)
    } else {
      console.log(`${adminEmail} already has ADMIN role`)
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

ensureAdminRole()