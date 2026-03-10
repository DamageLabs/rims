import { getDatabase, count } from './index';

// Preset inventory type schemas (mirrors PRESET_TYPES from inventoryTypeService)
const ELECTRONICS_SCHEMA = JSON.stringify([
  { key: 'modelNumber', label: 'Model Number', type: 'text', required: false, placeholder: 'e.g., R3, V3' },
  { key: 'partNumber', label: 'Part Number', type: 'text', required: false, placeholder: 'e.g., 50, 1501' },
  { key: 'vendorName', label: 'Vendor Name', type: 'text', required: false, placeholder: 'e.g., Adafruit, SparkFun' },
  { key: 'vendorUrl', label: 'Vendor URL', type: 'text', required: false, placeholder: 'https://...' },
]);

const FIREARMS_SCHEMA = JSON.stringify([
  { key: 'serialNumber', label: 'Serial Number', type: 'text', required: true },
  { key: 'caliber', label: 'Caliber', type: 'text', required: true, placeholder: 'e.g., 9mm, .223, 12ga' },
  { key: 'barrelLength', label: 'Barrel Length', type: 'text', required: false, placeholder: 'e.g., 16"' },
  { key: 'action', label: 'Action', type: 'select', required: false, options: ['Semi-Automatic', 'Bolt Action', 'Pump Action', 'Lever Action', 'Revolver', 'Single Shot', 'Full Auto'] },
  { key: 'manufacturer', label: 'Manufacturer', type: 'text', required: false },
  { key: 'triggerPull', label: 'Trigger Pull', type: 'text', required: false, placeholder: 'e.g., 5.5 lbs' },
  { key: 'frame', label: 'Frame', type: 'select', required: false, options: ['Polymer', 'Aluminum', 'Steel', 'Titanium', 'Alloy'] },
  { key: 'weight', label: 'Weight', type: 'text', required: false, placeholder: 'e.g., 30 oz' },
  { key: 'fflRequired', label: 'FFL Required', type: 'boolean', required: false },
  { key: 'condition', label: 'Condition', type: 'select', required: false, options: ['New', 'Like New', 'Excellent', 'Very Good', 'Good', 'Fair', 'Poor'] },
]);

const AMMUNITION_SCHEMA = JSON.stringify([
  { key: 'caliber', label: 'Caliber', type: 'text', required: true, placeholder: 'e.g., 9mm, .223, 12ga' },
  { key: 'grainWeight', label: 'Grain Weight', type: 'number', required: false, placeholder: 'e.g., 115, 55' },
  { key: 'cartridgeType', label: 'Cartridge Type', type: 'select', required: false, options: ['FMJ', 'JHP', 'SP', 'BTHP', 'Buckshot', 'Slug', 'Birdshot', 'Tracer', 'AP'] },
  { key: 'roundCount', label: 'Rounds Per Box', type: 'number', required: false, placeholder: 'e.g., 50, 20' },
  { key: 'casing', label: 'Casing', type: 'select', required: false, options: ['Brass', 'Steel', 'Aluminum', 'Nickel-Plated'] },
  { key: 'manufacturer', label: 'Manufacturer', type: 'text', required: false },
]);

const INVENTORY_TYPES = [
  { name: 'Electronics', icon: 'FaMicrochip', schema: ELECTRONICS_SCHEMA },
  { name: 'Firearms', icon: 'FaCrosshairs', schema: FIREARMS_SCHEMA },
  { name: 'Ammunition', icon: 'FaShieldAlt', schema: AMMUNITION_SCHEMA },
];

const CATEGORY_PRESETS: Record<string, string[]> = {
  Electronics: [
    'Arduino', 'Raspberry Pi', 'BeagleBone', 'Prototyping', 'Kits & Projects',
    'Boards', 'LCDs & Displays', 'LEDs', 'Power', 'Cables', 'Tools',
    'Robotics', 'CNC', 'Components & Parts', 'Sensors', '3D Printing', 'Wireless',
  ],
  Firearms: ['Handguns', 'Rifles', 'Shotguns', 'Accessories', 'Optics', 'Holsters & Cases'],
  Ammunition: ['Rimfire', 'Centerfire Pistol', 'Centerfire Rifle', 'Shotshell', 'Specialty'],
};

function ensureInventoryTypes(): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  const upsert = db.prepare(`
    INSERT INTO inventory_types (name, icon, schema, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET schema = excluded.schema, updated_at = excluded.updated_at
  `);
  for (const t of INVENTORY_TYPES) {
    upsert.run(t.name, t.icon, t.schema, now, now);
  }
}

type ItemTuple = [string, string, string, string, string, number, number, string, string, string, string, number];

function eItem(
  name: string, desc: string, model: string, part: string, vendor: string,
  qty: number, unit: number, url: string, cat: string, loc: string, barcode: string, reorder: number
): ItemTuple {
  return [name, desc, model, part, vendor, qty, unit, url, cat, loc, barcode, reorder];
}

const SEED_ELECTRONICS: ItemTuple[] = [
  eItem('Arduino Uno', 'The Arduino Uno is a microcontroller board based on the ATmega328.', 'R3', '50', 'Adafruit', 8, 24.95, 'https://www.adafruit.com/product/50', 'Arduino', 'H1LD1B1', 'RIMS-0001', 5),
  eItem('Arduino Mega 2560', 'The Arduino Mega 2560 is a microcontroller board based on the ATmega2560.', 'R3', '191', 'Adafruit', 1, 45.95, 'https://www.adafruit.com/product/191', 'Arduino', 'H1LD1B3', 'RIMS-0002', 2),
  eItem('Arduino Nano', 'Compact Arduino board with ATmega328P, ideal for breadboard projects.', 'V3', '1501', 'SparkFun', 15, 22.95, 'https://www.sparkfun.com/products/1501', 'Arduino', 'H1LD1B2', 'RIMS-0003', 5),
  eItem('Raspberry Pi 4 Model B', 'Quad-core 64-bit ARM Cortex-A72 running at 1.5GHz with 4GB RAM.', '4B-4GB', '4292', 'Adafruit', 5, 55.00, 'https://www.adafruit.com/product/4292', 'Raspberry Pi', 'H1LD2B1', 'RIMS-0004', 3),
  eItem('Raspberry Pi Zero 2 W', 'Compact single-board computer with wireless connectivity.', 'Zero2W', '5291', 'Adafruit', 10, 15.00, 'https://www.adafruit.com/product/5291', 'Raspberry Pi', 'H1LD2B2', 'RIMS-0005', 5),
  eItem('DHT22 Temperature & Humidity Sensor', 'Digital temperature and humidity sensor with single-wire interface.', 'DHT22', '385', 'Adafruit', 25, 9.95, 'https://www.adafruit.com/product/385', 'Sensors', 'H2LD1B1', 'RIMS-0006', 10),
  eItem('HC-SR04 Ultrasonic Distance Sensor', 'Ultrasonic ranging module with 2cm to 400cm range.', 'HC-SR04', '3942', 'Adafruit', 20, 3.95, 'https://www.adafruit.com/product/3942', 'Sensors', 'H2LD1B2', 'RIMS-0007', 10),
  eItem('MPU-6050 Accelerometer & Gyroscope', '6-axis motion tracking device with I2C interface.', 'MPU-6050', 'SEN-11028', 'SparkFun', 12, 14.95, 'https://www.sparkfun.com/products/11028', 'Sensors', 'H2LD1B3', 'RIMS-0008', 5),
  eItem('16x2 LCD Display with I2C', 'Blue backlight 16x2 character LCD with I2C interface module.', 'LCD1602-I2C', '181', 'Adafruit', 18, 12.95, 'https://www.adafruit.com/product/181', 'LCDs & Displays', 'H2LD2B1', 'RIMS-0009', 8),
  eItem('0.96" OLED Display 128x64', 'Small monochrome OLED display with I2C interface.', 'SSD1306', '326', 'Adafruit', 30, 7.95, 'https://www.adafruit.com/product/326', 'LCDs & Displays', 'H2LD2B2', 'RIMS-0010', 15),
  eItem('NeoPixel Ring 16 RGB LED', 'Ring of 16 individually addressable RGB LEDs.', 'WS2812B-16', '1463', 'Adafruit', 8, 9.95, 'https://www.adafruit.com/product/1463', 'LEDs', 'H2LD3B1', 'RIMS-0011', 5),
  eItem('LED Assortment Kit 5mm', '100 piece LED kit with red, green, yellow, blue, and white LEDs.', 'LED-5MM-KIT', 'COM-12062', 'SparkFun', 5, 8.95, 'https://www.sparkfun.com/products/12062', 'LEDs', 'H2LD3B2', 'RIMS-0012', 3),
  eItem('Resistor Kit 1/4W', '500 piece resistor assortment from 10 ohm to 1M ohm.', 'RES-KIT-500', 'COM-10969', 'SparkFun', 3, 12.95, 'https://www.sparkfun.com/products/10969', 'Components & Parts', 'H3LD1B1', 'RIMS-0013', 2),
  eItem('Ceramic Capacitor Kit', '300 piece ceramic capacitor assortment, various values.', 'CAP-KIT-300', 'COM-13698', 'SparkFun', 4, 9.95, 'https://www.sparkfun.com/products/13698', 'Components & Parts', 'H3LD1B2', 'RIMS-0014', 2),
  eItem('Electrolytic Capacitor Kit', '100 piece electrolytic capacitor assortment, 1uF to 1000uF.', 'ECAP-KIT-100', '2975', 'Adafruit', 6, 7.95, 'https://www.adafruit.com/product/2975', 'Components & Parts', 'H3LD1B3', 'RIMS-0015', 3),
  eItem('5V 2.5A Power Supply', 'USB-C power supply for Raspberry Pi 4, 5V 2.5A output.', 'PS-5V-2.5A', '4298', 'Adafruit', 10, 8.95, 'https://www.adafruit.com/product/4298', 'Power', 'H3LD2B1', 'RIMS-0016', 5),
  eItem('18650 Li-Ion Battery', 'Rechargeable 3.7V 2600mAh lithium-ion battery.', '18650-2600', '1781', 'Adafruit', 20, 9.95, 'https://www.adafruit.com/product/1781', 'Power', 'H3LD2B2', 'RIMS-0017', 10),
  eItem('LM7805 Voltage Regulator', '5V 1A linear voltage regulator IC.', 'LM7805', '2164', 'Adafruit', 50, 0.75, 'https://www.adafruit.com/product/2164', 'Power', 'H3LD2B3', 'RIMS-0018', 20),
  eItem('Full-Size Breadboard', '830 tie-point solderless breadboard.', 'BB-830', '239', 'Adafruit', 12, 5.95, 'https://www.adafruit.com/product/239', 'Prototyping', 'H3LD3B1', 'RIMS-0019', 5),
  eItem('Jumper Wire Kit', '65 piece jumper wire kit for breadboarding.', 'JW-65', '153', 'Adafruit', 8, 6.95, 'https://www.adafruit.com/product/153', 'Prototyping', 'H3LD3B2', 'RIMS-0020', 4),
  eItem('Perfboard 5x7cm', 'Double-sided prototype PCB board, 5x7cm.', 'PB-5x7', '2670', 'Adafruit', 25, 1.50, 'https://www.adafruit.com/product/2670', 'Prototyping', 'H3LD3B3', 'RIMS-0021', 10),
  eItem('ESP32 Development Board', 'WiFi and Bluetooth enabled microcontroller development board.', 'ESP32-DEVKIT', '3405', 'Adafruit', 10, 14.95, 'https://www.adafruit.com/product/3405', 'Wireless', 'H4LD1B1', 'RIMS-0022', 5),
  eItem('nRF24L01+ Wireless Module', '2.4GHz wireless transceiver module.', 'nRF24L01+', 'WRL-00691', 'SparkFun', 15, 6.95, 'https://www.sparkfun.com/products/691', 'Wireless', 'H4LD1B2', 'RIMS-0023', 8),
  eItem('Servo Motor SG90', 'Micro servo motor, 180 degree rotation, 9g weight.', 'SG90', '169', 'Adafruit', 20, 5.95, 'https://www.adafruit.com/product/169', 'Robotics', 'H4LD2B1', 'RIMS-0024', 10),
  eItem('DC Motor with Gearbox', '6V DC motor with 48:1 gearbox, 200 RPM.', 'DCM-48', '3777', 'Adafruit', 8, 3.50, 'https://www.adafruit.com/product/3777', 'Robotics', 'H4LD2B2', 'RIMS-0025', 5),
  eItem('L298N Motor Driver', 'Dual H-bridge motor driver module for DC motors.', 'L298N', 'ROB-14450', 'SparkFun', 6, 12.95, 'https://www.sparkfun.com/products/14450', 'Robotics', 'H4LD2B3', 'RIMS-0026', 3),
  eItem('Soldering Iron 60W', 'Temperature adjustable soldering iron with stand.', 'SI-60W', '180', 'Adafruit', 3, 22.00, 'https://www.adafruit.com/product/180', 'Tools', 'H5LD1B1', 'RIMS-0027', 2),
  eItem('Digital Multimeter', 'Auto-ranging digital multimeter with LCD display.', 'DMM-AR', '2034', 'Adafruit', 4, 17.50, 'https://www.adafruit.com/product/2034', 'Tools', 'H5LD1B2', 'RIMS-0028', 2),
  eItem('USB-C Cable 1m', 'USB-C to USB-A cable, 1 meter length.', 'USB-C-1M', '4474', 'Adafruit', 15, 4.95, 'https://www.adafruit.com/product/4474', 'Cables', 'H5LD2B1', 'RIMS-0029', 8),
  eItem('Micro USB Cable 1m', 'Micro USB to USB-A cable, 1 meter length.', 'MUSB-1M', '592', 'Adafruit', 20, 2.95, 'https://www.adafruit.com/product/592', 'Cables', 'H5LD2B2', 'RIMS-0030', 10),
  eItem('Dupont Connector Kit', '310 piece male/female dupont connector and crimping kit.', 'DPK-310', 'PRT-14574', 'SparkFun', 7, 11.95, 'https://www.sparkfun.com/products/14574', 'Components & Parts', 'H3LD1B4', 'RIMS-0031', 3),
];

export function seedDatabase(): void {
  const db = getDatabase();
  const userCount = count('users');

  if (userCount > 0) {
    // Existing DB — just ensure inventory types are present
    ensureInventoryTypes();
    return;
  }

  // Fresh database — seed everything in a transaction
  const seed = db.transaction(() => {
    const now = new Date().toISOString();

    // --- Users ---
    const insertUser = db.prepare(`
      INSERT INTO users (email, password, role, sign_in_count, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, 0, 1, ?, ?)
    `);
    insertUser.run('admin@example.com', 'changeme', 'admin', now, now);
    insertUser.run('user@example.com', 'changeme', 'user', now, now);

    // --- Inventory Types ---
    const insertType = db.prepare(`
      INSERT INTO inventory_types (name, icon, schema, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    const typeIds: Record<string, number> = {};
    for (const t of INVENTORY_TYPES) {
      const result = insertType.run(t.name, t.icon, t.schema, now, now);
      typeIds[t.name] = Number(result.lastInsertRowid);
    }

    // --- Categories ---
    const insertCategory = db.prepare(`
      INSERT INTO categories (name, sort_order, inventory_type_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const [typeName, cats] of Object.entries(CATEGORY_PRESETS)) {
      const typeId = typeIds[typeName];
      cats.forEach((cat, idx) => {
        insertCategory.run(cat, idx, typeId, now, now);
      });
    }

    // --- Electronics Items ---
    const insertItem = db.prepare(`
      INSERT INTO items (name, description, quantity, unit_value, value, category, location, barcode, reorder_point, inventory_type_id, custom_fields, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const electronicsTypeId = typeIds['Electronics'];
    for (const [name, desc, model, part, vendor, qty, unit, url, cat, loc, barcode, reorder] of SEED_ELECTRONICS) {
      const customFields = JSON.stringify({ modelNumber: model, partNumber: part, vendorName: vendor, vendorUrl: url });
      insertItem.run(name, desc, qty, unit, qty * unit, cat, loc, barcode, reorder, electronicsTypeId, customFields, now, now);
    }

    // --- Firearms Item (Glock 19 Gen 5) ---
    const firearmsTypeId = typeIds['Firearms'];
    const glockFields = JSON.stringify({
      serialNumber: 'BXYZ1234', caliber: '9mm', barrelLength: '4.02"',
      action: 'Semi-Automatic', manufacturer: 'Glock', triggerPull: '5.5 lbs',
      frame: 'Polymer', weight: '23.63 oz', fflRequired: true, condition: 'Like New',
    });
    insertItem.run('Glock 19 Gen 5', 'Compact 9mm semi-automatic pistol, standard law enforcement and civilian model.', 1, 549.00, 549.00, 'Handguns', 'Safe A1', 'RIMS-F001', 0, firearmsTypeId, glockFields, now, now);
  });

  seed();
  console.log('Database seeded: 2 users, 3 inventory types, 28 categories, 32 items');
}
