import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type MenuItemSeed = {
  name: string;
  price: number;
  category: string;
  region?: string;
  allergens: string[];
  dietary: string[];
};

type VendorSeed = {
  name: string;
  cuisine: string;
  imageUrl?: string;
  items: MenuItemSeed[];
};

const vendorsData: VendorSeed[] = [
  {
    name: "Tony's Pizza",
    cuisine: "Italian",
    imageUrl: "/images/pizza.jpg",
    items: [
      { name: "Margherita Pizza", price: 9.99, category: "Pizza", allergens: ["dairy", "gluten"], dietary: ["vegetarian"] },
      { name: "Pepperoni Pizza", price: 11.99, category: "Pizza", allergens: ["dairy", "gluten"], dietary: [] },
      { name: "Vegan Garden Pizza", price: 10.99, category: "Pizza", allergens: ["gluten"], dietary: ["vegan", "vegetarian"] },
    ],
  },
  {
    name: "El Camino Tacos",
    cuisine: "Mexican",
    imageUrl: "/images/tacos.jpg",
    items: [
      { name: "Carne Asada Tacos", price: 8.99, category: "Tacos", allergens: [], dietary: [] },
      { name: "Fish Tacos", price: 9.99, category: "Tacos", allergens: ["fish", "gluten"], dietary: [] },
      { name: "Black Bean Tacos", price: 7.99, category: "Tacos", allergens: [], dietary: ["vegan", "vegetarian"] },
    ],
  },
  {
    name: "Burger Boulevard",
    cuisine: "American",
    imageUrl: "/images/burgers.jpg",
    items: [
      { name: "Classic Cheeseburger", price: 9.99, category: "Burgers", allergens: ["dairy", "gluten"], dietary: [] },
      { name: "Veggie Burger", price: 8.99, category: "Burgers", allergens: ["gluten"], dietary: ["vegetarian"] },
    ],
  },
  {
    name: "The Codfather",
    cuisine: "British",
    imageUrl: "/images/fish-chips.jpg",
    items: [
      { name: "Classic Fish & Chips", price: 10.99, category: "Fish & Chips", allergens: ["fish", "gluten"], dietary: [] },
      { name: "Haddock & Chips", price: 11.99, category: "Fish & Chips", allergens: ["fish", "gluten"], dietary: [] },
      { name: "Sausage & Chips", price: 7.99, category: "Fish & Chips", allergens: ["gluten"], dietary: [] },
      { name: "Halloumi & Chips", price: 8.99, category: "Fish & Chips", allergens: ["dairy", "gluten"], dietary: ["vegetarian"] },
    ],
  },
  {
    name: "Spice Garden",
    cuisine: "Indian",
    imageUrl: "/images/curry.jpg",
    items: [
      { name: "Chicken Tikka Masala", price: 12.99, category: "Curry", allergens: ["dairy"], dietary: [] },
      { name: "Lamb Rogan Josh", price: 13.99, category: "Curry", allergens: [], dietary: [] },
      { name: "Vegetable Biryani", price: 10.99, category: "Curry", allergens: [], dietary: ["vegetarian", "vegan"] },
      { name: "Paneer Tikka", price: 11.99, category: "Curry", allergens: ["dairy"], dietary: ["vegetarian"] },
      { name: "Garlic Naan", price: 3.99, category: "Sides", allergens: ["dairy", "gluten"], dietary: ["vegetarian"] },
    ],
  },
  {
    name: "Brew & Bites",
    cuisine: "Coffee & Bakery",
    imageUrl: "/images/coffee.jpg",
    items: [
      { name: "Flat White", price: 3.5, category: "Coffee", allergens: ["dairy"], dietary: ["vegetarian"] },
      { name: "Cappuccino", price: 3.5, category: "Coffee", allergens: ["dairy"], dietary: ["vegetarian"] },
      { name: "Oat Milk Latte", price: 4, category: "Coffee", allergens: [], dietary: ["vegetarian", "vegan"] },
      { name: "Pain au Chocolat", price: 3.5, category: "Pastries", allergens: ["dairy", "gluten"], dietary: ["vegetarian"] },
      { name: "Blueberry Muffin", price: 2.99, category: "Pastries", allergens: ["dairy", "gluten", "eggs"], dietary: ["vegetarian"] },
      { name: "Vegan Brownie", price: 3.99, category: "Pastries", allergens: ["gluten"], dietary: ["vegetarian", "vegan"] },
    ],
  },
  {
    name: "Smokehouse Grill",
    cuisine: "BBQ",
    imageUrl: "/images/bbq.jpg",
    items: [
      { name: "Pulled Pork Sandwich", price: 10.99, category: "BBQ", allergens: ["gluten"], dietary: [] },
      { name: "Beef Brisket", price: 13.99, category: "BBQ", allergens: [], dietary: [] },
      { name: "BBQ Chicken Wings", price: 8.99, category: "BBQ", allergens: ["dairy"], dietary: [] },
      { name: "Mac & Cheese", price: 6.99, category: "Sides", allergens: ["dairy", "gluten"], dietary: ["vegetarian"] },
      { name: "Corn on the Cob", price: 4.99, category: "Sides", allergens: ["dairy"], dietary: ["vegetarian"] },
    ],
  },
  {
    name: "Sweet Treats",
    cuisine: "Desserts",
    imageUrl: "/images/desserts.jpg",
    items: [
      { name: "Vanilla Ice Cream", price: 4.99, category: "Ice Cream", allergens: ["dairy", "eggs"], dietary: ["vegetarian"] },
      { name: "Chocolate Fudge Sundae", price: 6.99, category: "Ice Cream", allergens: ["dairy", "eggs"], dietary: ["vegetarian"] },
      { name: "Strawberry Cheesecake", price: 5.99, category: "Desserts", allergens: ["dairy", "gluten", "eggs"], dietary: ["vegetarian"] },
      { name: "Vegan Chocolate Cake", price: 5.99, category: "Desserts", allergens: ["gluten"], dietary: ["vegetarian", "vegan"] },
      { name: "Apple Crumble", price: 5.99, category: "Desserts", allergens: ["dairy", "gluten"], dietary: ["vegetarian"] },
    ],
  },
];

async function main() {
  console.log("Cleaning existing data...");
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.session.deleteMany();

  console.log("Seeding vendors and menu items...");
  for (const v of vendorsData) {
    const vendor = await prisma.vendor.create({
      data: {
        name: v.name,
        cuisine: v.cuisine,
        imageUrl: v.imageUrl,
      },
    });
    for (const item of v.items) {
      await prisma.menuItem.create({
        data: {
          name: item.name,
          price: item.price,
          category: item.category,
          region: item.region ?? null,
          allergens: item.allergens,
          isVegan: item.dietary.includes("vegan"),
          vendorId: vendor.id,
        },
      });
    }
    console.log(`  - ${v.name} (${v.items.length} items)`);
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
