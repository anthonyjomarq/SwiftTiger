const axios = require("axios");

// Test configuration
const BASE_URL = "http://localhost:5000";
let authToken = "";

// Test data
const testUser = {
  email: "admin@test.com",
  password: "password123",
  name: "Test Admin",
};

const testJob = {
  title: "Test Job for Updates",
  description: "This is a test job to verify the updates system",
  status: "pending",
};

async function testJobUpdates() {
  try {
    console.log("🧪 Testing Job Updates System...\n");

    // 1. Register/Login user
    console.log("1. Authenticating user...");
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: testUser.email,
        password: testUser.password,
      });
      authToken = loginResponse.data.token;
      console.log("✅ Login successful");
    } catch (error) {
      if (error.response?.status === 400) {
        // User doesn't exist, try to register
        console.log("User not found, registering...");
        const registerResponse = await axios.post(
          `${BASE_URL}/api/auth/register`,
          {
            name: testUser.name,
            email: testUser.email,
            password: testUser.password,
            role: "admin",
          }
        );
        authToken = registerResponse.data.token;
        console.log("✅ Registration successful");
      } else {
        throw error;
      }
    }

    // Set auth header
    axios.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;

    // 2. Create a test job
    console.log("\n2. Creating test job...");
    const jobResponse = await axios.post(`${BASE_URL}/api/jobs`, testJob);
    const jobId = jobResponse.data.id;
    console.log(`✅ Job created with ID: ${jobId}`);

    // 3. Add a job update
    console.log("\n3. Adding job update...");
    const updateResponse = await axios.post(
      `${BASE_URL}/api/jobs/${jobId}/updates`,
      {
        content: "This is a test update from the automated test",
        update_type: "comment",
      }
    );
    console.log("✅ Job update added successfully");

    // 4. Get job updates
    console.log("\n4. Fetching job updates...");
    const updatesResponse = await axios.get(
      `${BASE_URL}/api/jobs/${jobId}/updates`
    );
    console.log(`✅ Found ${updatesResponse.data.updates.length} updates`);

    // 5. Update job status (should create automatic update)
    console.log("\n5. Updating job status...");
    await axios.put(`${BASE_URL}/api/jobs/${jobId}`, {
      ...testJob,
      status: "in_progress",
    });
    console.log("✅ Job status updated");

    // 6. Get updated job updates
    console.log("\n6. Fetching updated job updates...");
    const updatedUpdatesResponse = await axios.get(
      `${BASE_URL}/api/jobs/${jobId}/updates`
    );
    console.log(
      `✅ Found ${updatedUpdatesResponse.data.updates.length} updates after status change`
    );

    // 7. Get activity feed
    console.log("\n7. Fetching activity feed...");
    const activityResponse = await axios.get(`${BASE_URL}/api/activity-feed`);
    console.log(
      `✅ Activity feed contains ${activityResponse.data.updates.length} activities`
    );

    // 8. Get jobs with update count
    console.log("\n8. Fetching jobs with update count...");
    const jobsResponse = await axios.get(`${BASE_URL}/api/jobs`);
    const jobWithUpdates = jobsResponse.data.jobs.find((j) => j.id === jobId);
    console.log(`✅ Job has ${jobWithUpdates.update_count} updates`);

    console.log(
      "\n🎉 All tests passed! Job updates system is working correctly."
    );
  } catch (error) {
    console.error("\n❌ Test failed:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    if (error.request) {
      console.error("Request:", error.request);
    }
    console.error("Error message:", error.message);
    console.error("Stack:", error.stack);
  }
}

// Run the test
testJobUpdates();
