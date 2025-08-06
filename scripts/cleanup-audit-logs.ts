import { AuditLogger } from '@/lib/audit-logger'

async function cleanupAuditLogs() {
  console.log('Starting audit log cleanup...')
  
  try {
    // Clean up logs older than 90 days
    const deletedCount = await AuditLogger.cleanupOldLogs(90)
    console.log(`✅ Cleaned up ${deletedCount} old audit logs`)
  } catch (error) {
    console.error('❌ Error cleaning up audit logs:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  cleanupAuditLogs()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export default cleanupAuditLogs