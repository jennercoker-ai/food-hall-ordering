import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const vendors = [
  {
    name: "Tony's Pizza",
    cuisine: 'Italian',
    description: 'Authentic wood-fired Neapolitan pizzas',
    imageUrl: '/vendors/pizza.jpg',
    collectionPoint: 'Station 1',
    items: [
      { name: 'Margherita Pizza', price: 12.99, category: 'Pizza', description: 'Fresh mozzarella, basil, San Marzano tomatoes', allergens: ['gluten', 'dairy'], dietary: ['vegetarian'] },
      { name: 'Pepperoni Pizza', price: 14.99, category: 'Pizza', description: 'Classic pepperoni with mozzarella', allergens: ['gluten', 'dairy'], dietary: [] },
      { name: 'Quattro Formaggi', price: 15.99, category: 'Pizza', description: 'Four cheese blend pizza', allergens: ['gluten', 'dairy'], dietary: ['vegetarian'] },
      { name: 'Vegan Garden Pizza', price: 13.99, category: 'Pizza', description: 'Seasonal vegetables with vegan cheese', allergens: ['gluten'], dietary: ['vegan'], isVegan: true },
      { name: 'Garlic Bread', price: 5.99, category: 'Sides', description: 'Crispy garlic bread with herbs', allergens: ['gluten', 'dairy'], dietary: ['vegetarian'] },
      { name: 'Italian Soda', price: 3.50, category: 'Drinks', description: 'Refreshing sparkling beverage', allergens: [], dietary: ['vegan'] },
    ],
  },
  {
    name: 'El Camino Tacos',
    cuisine: 'Mexican',
    description: 'Street-style tacos and burritos',
    imageUrl: '/vendors/tacos.jpg',
    collectionPoint: 'Station 2',
    items: [
      { name: 'Carne Asada Tacos', price: 11.99, category: 'Tacos', description: 'Grilled steak with cilantro and onions', allergens: ['gluten'], dietary: [] },
      { name: 'Chicken Burrito', price: 12.99, category: 'Burritos', description: 'Loaded chicken burrito with rice and beans', allergens: ['gluten', 'dairy'], dietary: [] },
      { name: 'Veggie Quesadilla', price: 10.99, category: 'Quesadillas', description: 'Grilled vegetables with melted cheese', allergens: ['gluten', 'dairy'], dietary: ['vegetarian'] },
      { name: 'Guacamole & Chips', price: 7.99, category: 'Sides', description: 'Fresh guacamole with tortilla chips', allergens: [], dietary: ['vegan', 'gluten-free'], isVegan: true },
      { name: 'Horchata', price: 4.50, category: 'Drinks', description: 'Traditional rice drink with cinnamon', allergens: [], dietary: ['vegan'] },
    ],
  },
  {
    name: 'Burger Boulevard',
    cuisine: 'American',
    description: 'Gourmet burgers and loaded fries',
    imageUrl: '/vendors/burgers.jpg',
    collectionPoint: 'Station 3',
    items: [
      { name: 'Classic Smash Burger', price: 13.99, category: 'Burgers', description: 'Double patty, American cheese, special sauce', allergens: ['gluten', 'dairy', 'egg'], dietary: [] },
      { name: 'BBQ Bacon Burger', price: 15.99, category: 'Burgers', description: 'Smoky bacon with BBQ sauce', allergens: ['gluten', 'dairy'], dietary: [] },
      { name: 'Beyond Burger', price: 14.99, category: 'Burgers', description: 'Plant-based patty with all the fixings', allergens: ['gluten', 'soy'], dietary: ['vegan'], isVegan: true },
      { name: 'Loaded Fries', price: 8.99, category: 'Sides', description: 'Cheese, bacon, jalapeños', allergens: ['dairy'], dietary: [] },
      { name: 'Milkshake', price: 6.99, category: 'Drinks', description: 'Thick and creamy vanilla shake', allergens: ['dairy'], dietary: ['vegetarian'] },
    ],
  },
  {
    name: 'Spice Garden',
    cuisine: 'Indian',
    description: 'Authentic curries and tandoori dishes',
    imageUrl: '/vendors/indian.jpg',
    collectionPoint: 'Station 4',
    items: [
      { name: 'Butter Chicken', price: 14.99, category: 'Curries', description: 'Creamy tomato curry with tender chicken', allergens: ['dairy', 'nuts'], dietary: [] },
      { name: 'Vegetable Biryani', price: 12.99, category: 'Rice', description: 'Fragrant basmati with mixed vegetables', allergens: ['nuts'], dietary: ['vegan', 'gluten-free'], isVegan: true },
      { name: 'Samosa Platter', price: 7.99, category: 'Starters', description: 'Crispy pastries with spiced potatoes', allergens: ['gluten'], dietary: ['vegan'], isVegan: true },
      { name: 'Garlic Naan', price: 3.99, category: 'Bread', description: 'Soft flatbread with garlic butter', allergens: ['gluten', 'dairy'], dietary: ['vegetarian'] },
      { name: 'Mango Lassi', price: 4.99, category: 'Drinks', description: 'Yogurt smoothie with mango', allergens: ['dairy'], dietary: ['vegetarian'] },
    ],
  },
  {
    name: '3 Jays & D Bar',
    cuisine: 'Bar',
    description: 'Craft cocktails, beers, and spirits',
    imageUrl: '/vendors/bar.jpg',
    collectionPoint: 'The Bar',
    items: [
      { name: 'House Lager', price: 5.50, category: 'Beer', description: 'Crisp, refreshing lager', allergens: ['gluten'], dietary: ['vegan'] },
      { name: 'Craft IPA', price: 7.00, category: 'Beer', description: 'Hoppy India Pale Ale', allergens: ['gluten'], dietary: ['vegan'] },
      { name: 'House Red Wine', price: 8.00, category: 'Wine', description: 'Smooth Merlot blend', allergens: ['sulfites'], dietary: ['vegan'] },
      { name: 'Margarita', price: 10.00, category: 'Cocktails', description: 'Classic lime margarita', allergens: [], dietary: ['vegan'] },
      { name: 'Old Fashioned', price: 12.00, category: 'Cocktails', description: 'Bourbon, bitters, orange', allergens: [], dietary: ['vegan'] },
      { name: 'Virgin Mojito', price: 6.00, category: 'Mocktails', description: 'Mint, lime, sparkling water', allergens: [], dietary: ['vegan'], isVegan: true },
    ],
  },
  {
    name: 'Sweet Treats',
    cuisine: 'Desserts',
    description: 'Artisan desserts and ice cream',
    imageUrl: '/vendors/desserts.jpg',
    collectionPoint: 'Station 5',
    items: [
      { name: 'Chocolate Brownie', price: 5.99, category: 'Baked Goods', description: 'Warm fudgy brownie with ice cream', allergens: ['gluten', 'dairy', 'egg', 'nuts'], dietary: ['vegetarian'] },
      { name: 'Churros', price: 6.99, category: 'Fried Desserts', description: 'Cinnamon sugar churros with chocolate', allergens: ['gluten', 'dairy'], dietary: ['vegetarian'] },
      { name: 'Vegan Ice Cream', price: 4.99, category: 'Ice Cream', description: 'Coconut-based vanilla', allergens: ['coconut'], dietary: ['vegan'], isVegan: true },
      { name: 'Cheesecake Slice', price: 7.99, category: 'Cakes', description: 'New York style cheesecake', allergens: ['gluten', 'dairy', 'egg'], dietary: ['vegetarian'] },
      { name: 'Fresh Fruit Cup', price: 4.50, category: 'Fresh', description: 'Seasonal mixed fruits', allergens: [], dietary: ['vegan', 'gluten-free'], isVegan: true },
    ],
  },
];

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.vendor.deleteMany();

  console.log('🗑️  Cleared existing data');

  // Create vendors and menu items
  for (const vendorData of vendors) {
    const { items, ...vendor } = vendorData;
    
    const createdVendor = await prisma.vendor.create({
      data: vendor,
    });

    console.log(`✅ Created vendor: ${createdVendor.name}`);

    for (const item of items) {
      await prisma.menuItem.create({
        data: {
          ...item,
          vendorId: createdVendor.id,
        },
      });
    }

    console.log(`   📦 Added ${items.length} menu items`);
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
