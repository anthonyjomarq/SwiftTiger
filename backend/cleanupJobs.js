const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('swifttiger', 'swifttiger', 'password', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false
});

async function cleanupAndKeep30Jobs() {
  try {
    console.log('🗑️  Starting job cleanup - keeping only 30 jobs from mock data...');
    
    // First, let's see what we have
    const [allJobs] = await sequelize.query(`
      SELECT j.id, j."jobName", j."scheduledDate", c.name as customer_name, c.address_city
      FROM jobs j 
      LEFT JOIN customers c ON j."customerId" = c.id
      WHERE j."scheduledDate" >= '2025-07-08 00:00:00' 
      AND j."scheduledDate" < '2025-07-09 00:00:00'
      ORDER BY j."createdAt" ASC
    `);
    
    console.log(`📊 Found ${allJobs.length} jobs scheduled for 2025-07-08`);
    
    // Get the first 30 jobs (these will be kept)
    const jobsToKeep = allJobs.slice(0, 30);
    const jobsToDelete = allJobs.slice(30);
    
    console.log(`✅ Keeping first 30 jobs`);
    console.log(`🗑️  Deleting ${jobsToDelete.length} excess jobs`);
    
    if (jobsToDelete.length > 0) {
      const jobIdsToDelete = jobsToDelete.map(job => `'${job.id}'`).join(',');
      
      console.log('🔄 Deleting excess jobs...');
      await sequelize.query(`
        DELETE FROM jobs 
        WHERE id IN (${jobIdsToDelete})
      `);
      
      console.log(`✅ Successfully deleted ${jobsToDelete.length} jobs`);
    }
    
    // Reset assignments for remaining jobs
    console.log('🔄 Resetting assignments for remaining 30 jobs...');
    await sequelize.query(`
      UPDATE jobs 
      SET "assignedTo" = NULL 
      WHERE "scheduledDate" >= '2025-07-08 00:00:00' 
      AND "scheduledDate" < '2025-07-09 00:00:00'
      AND status IN ('Pending', 'In Progress')
    `);
    
    // Verify final count
    const [finalCount] = await sequelize.query(`
      SELECT COUNT(*) as total_jobs
      FROM jobs j 
      WHERE j."scheduledDate" >= '2025-07-08 00:00:00' 
      AND j."scheduledDate" < '2025-07-09 00:00:00'
      AND j.status IN ('Pending', 'In Progress')
    `);
    
    console.log(`\n📈 Final job count for 2025-07-08: ${finalCount[0].total_jobs}`);
    
    // Show the remaining jobs
    const [remainingJobs] = await sequelize.query(`
      SELECT j.id, j."jobName", c.name as customer_name, c.address_city, j."estimatedDuration"
      FROM jobs j 
      LEFT JOIN customers c ON j."customerId" = c.id
      WHERE j."scheduledDate" >= '2025-07-08 00:00:00' 
      AND j."scheduledDate" < '2025-07-09 00:00:00'
      AND j.status IN ('Pending', 'In Progress')
      ORDER BY j."createdAt" ASC
      LIMIT 10
    `);
    
    console.log('\n📋 First 10 remaining jobs:');
    remainingJobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.jobName} → ${job.customer_name} (${job.address_city}) - ${job.estimatedDuration}min`);
    });
    
    console.log('\n✅ Cleanup completed successfully!');
    console.log('🎯 You now have exactly 30 jobs ready for geographic clustering and auto-assignment');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await sequelize.close();
    console.log('✅ Database connection closed');
  }
}

// Run the cleanup
cleanupAndKeep30Jobs();