import { addPickupToOrders } from "./migrations/add_pickup_to_orders";

async function runMigrations() {
  try {
    console.log("Starting database migrations...");
    
    // Run migrations in sequence
    await addPickupToOrders();
    
    console.log("All migrations completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration process failed:", error);
    process.exit(1);
  }
}

runMigrations();
