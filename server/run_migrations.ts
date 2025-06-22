import { addPickupToOrders } from "./add_pickup_to_orders";
import { addBouquetTables } from "./add_bouquet_tables";

async function runMigrations() {
  try {
    console.log("Starting database migrations...");
    
    // Run migrations in sequence
    await addPickupToOrders();
    await addBouquetTables();
    
    console.log("All migrations completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration process failed:", error);
    process.exit(1);
  }
}

runMigrations();
