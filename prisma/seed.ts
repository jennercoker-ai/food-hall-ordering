import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type MenuItemSeed = {
  name: string;
  price: number;
  category: string;
  description?: string;
  region?: string;
  allergens: string[];
  dietary: string[];
};

type VendorSeed = {
  name: string;
  cuisine: string;
  imageUrl?: string;
  collectionPoint?: string;
  items: MenuItemSeed[];
};

const vendorsData: VendorSeed[] = [
  {
    name: "Tony's Pizza",
    cuisine: "Italian",
    imageUrl: "/images/pizza.jpg",
    collectionPoint: "Station 1",
    items: [
      { name: "Margherita Pizza", price: 9.99, category: "Pizza", description: "Fresh mozzarella, basil, and tomato sauce", allergens: ["dairy", "gluten"], dietary: ["vegetarian"] },
      { name: "Pepperoni Pizza", price: 11.99, category: "Pizza", description: "Classic pepperoni with mozzarella", allergens: ["dairy", "gluten"], dietary: [] },
      { name: "Vegan Garden Pizza", price: 10.99, category: "Pizza", description: "Seasonal vegetables with vegan cheese", allergens: ["gluten"], dietary: ["vegan", "vegetarian"] },
      { name: "Italian Soda", price: 3.49, category: "Drinks", description: "Choice of flavors: lemon, orange, or cherry", allergens: [], dietary: ["vegan", "vegetarian"] },
      { name: "House Red Wine (Glass)", price: 6.99, category: "Drinks", description: "Italian Montepulciano", allergens: [], dietary: ["vegan", "vegetarian"] },
    ],
  },
  {
    name: "El Camino Tacos",
    cuisine: "Mexican",
    imageUrl: "/images/tacos.jpg",
    collectionPoint: "Station 2",
    items: [
      { name: "Carne Asada Tacos", price: 8.99, category: "Tacos", description: "Grilled steak with onions and cilantro", allergens: [], dietary: [] },
      { name: "Fish Tacos", price: 9.99, category: "Tacos", description: "Battered fish with cabbage slaw", allergens: ["fish", "gluten"], dietary: [] },
      { name: "Black Bean Tacos", price: 7.99, category: "Tacos", description: "Seasoned black beans with avocado", allergens: [], dietary: ["vegan", "vegetarian"] },
      { name: "Horchata", price: 3.99, category: "Drinks", description: "Traditional rice drink with cinnamon", allergens: [], dietary: ["vegan", "vegetarian"] },
      { name: "Jarritos", price: 2.99, category: "Drinks", description: "Mexican soda - various flavors", allergens: [], dietary: ["vegan", "vegetarian"] },
      { name: "Margarita", price: 8.99, category: "Drinks", description: "Classic lime margarita with salt rim", allergens: [], dietary: ["vegan", "vegetarian"] },
    ],
  },
  {
    name: "Burger Boulevard",
    cuisine: "American",
    imageUrl: "/images/burgers.jpg",
    collectionPoint: "Station 3",
    items: [
      { name: "Classic Cheeseburger", price: 9.99, category: "Burgers", description: "Beef patty with cheddar, lettuce, tomato", allergens: ["dairy", "gluten"], dietary: [] },
      { name: "Veggie Burger", price: 8.99, category: "Burgers", description: "House-made veggie patty", allergens: ["gluten"], dietary: ["vegetarian"] },
      { name: "Classic Milkshake", price: 5.49, category: "Drinks", description: "Vanilla, chocolate, or strawberry", allergens: ["dairy"], dietary: ["vegetarian"] },
      { name: "Root Beer Float", price: 4.99, category: "Drinks", description: "Classic root beer with vanilla ice cream", allergens: ["dairy"], dietary: ["vegetarian"] },
      { name: "Craft Lemonade", price: 3.49, category: "Drinks", description: "Fresh squeezed with mint", allergens: [], dietary: ["vegan", "vegetarian"] },
    ],
  },
  {
    name: "The Codfather",
    cuisine: "British",
    imageUrl: "/images/fish-chips.jpg",
    collectionPoint: "Station 4",
    items: [
      { name: "Classic Fish & Chips", price: 10.99, category: "Fish & Chips", description: "Beer-battered cod with chunky chips", allergens: ["fish", "gluten"], dietary: [] },
      { name: "Haddock & Chips", price: 11.99, category: "Fish & Chips", description: "Golden haddock with mushy peas", allergens: ["fish", "gluten"], dietary: [] },
      { name: "Sausage & Chips", price: 7.99, category: "Fish & Chips", description: "Battered sausage with chips and curry sauce", allergens: ["gluten"], dietary: [] },
      { name: "Halloumi & Chips", price: 8.99, category: "Fish & Chips", description: "Crispy halloumi with chips and salad", allergens: ["dairy", "gluten"], dietary: ["vegetarian"] },
      { name: "Dandelion & Burdock", price: 2.99, category: "Drinks", description: "Traditional British soft drink", allergens: [], dietary: ["vegan", "vegetarian"] },
      { name: "English Cider", price: 5.49, category: "Drinks", description: "Crisp Aspall Suffolk cider", allergens: [], dietary: ["vegan", "vegetarian"] },
      { name: "Cuppa Tea", price: 2.49, category: "Drinks", description: "Proper English breakfast tea", allergens: ["dairy"], dietary: ["vegetarian"] },
    ],
  },
  {
    name: "Spice Garden",
    cuisine: "Indian",
    imageUrl: "/images/curry.jpg",
    collectionPoint: "Station 5",
    items: [
      { name: "Chicken Tikka Masala", price: 12.99, category: "Curry", description: "Creamy tomato curry with basmati rice", allergens: ["dairy"], dietary: [] },
      { name: "Lamb Rogan Josh", price: 13.99, category: "Curry", description: "Aromatic lamb curry with naan bread", allergens: [], dietary: [] },
      { name: "Vegetable Biryani", price: 10.99, category: "Curry", description: "Fragrant rice with mixed vegetables", allergens: [], dietary: ["vegetarian", "vegan"] },
      { name: "Paneer Tikka", price: 11.99, category: "Curry", description: "Grilled paneer with mint chutney", allergens: ["dairy"], dietary: ["vegetarian"] },
      { name: "Garlic Naan", price: 3.99, category: "Sides", description: "Fresh baked naan with garlic butter", allergens: ["dairy", "gluten"], dietary: ["vegetarian"] },
      { name: "Mango Lassi", price: 4.49, category: "Drinks", description: "Sweet yogurt drink with mango", allergens: ["dairy"], dietary: ["vegetarian"] },
      { name: "Masala Chai", price: 3.49, category: "Drinks", description: "Spiced tea with cardamom and ginger", allergens: ["dairy"], dietary: ["vegetarian"] },
      { name: "Kingfisher Beer", price: 4.99, category: "Drinks", description: "Premium Indian lager", allergens: ["gluten"], dietary: ["vegan", "vegetarian"] },
    ],
  },
  {
    name: "Brew & Bites",
    cuisine: "Coffee & Bakery",
    imageUrl: "/images/coffee.jpg",
    collectionPoint: "Coffee Counter",
    items: [
      { name: "Flat White", price: 3.5, category: "Coffee", description: "Double espresso with steamed milk", allergens: ["dairy"], dietary: ["vegetarian"] },
      { name: "Cappuccino", price: 3.5, category: "Coffee", description: "Espresso with foamed milk", allergens: ["dairy"], dietary: ["vegetarian"] },
      { name: "Oat Milk Latte", price: 4, category: "Coffee", description: "Espresso with oat milk", allergens: [], dietary: ["vegetarian", "vegan"] },
      { name: "Pain au Chocolat", price: 3.5, category: "Pastries", description: "Buttery croissant with chocolate", allergens: ["dairy", "gluten"], dietary: ["vegetarian"] },
      { name: "Blueberry Muffin", price: 2.99, category: "Pastries", description: "Fresh baked with blueberries", allergens: ["dairy", "gluten", "eggs"], dietary: ["vegetarian"] },
      { name: "Vegan Brownie", price: 3.99, category: "Pastries", description: "Rich chocolate brownie", allergens: ["gluten"], dietary: ["vegetarian", "vegan"] },
    ],
  },
  {
    name: "Smokehouse Grill",
    cuisine: "BBQ",
    imageUrl: "/images/bbq.jpg",
    collectionPoint: "Station 6",
    items: [
      { name: "Pulled Pork Sandwich", price: 10.99, category: "BBQ", description: "Slow-cooked pork with BBQ sauce", allergens: ["gluten"], dietary: [] },
      { name: "Beef Brisket", price: 13.99, category: "BBQ", description: "Tender smoked brisket with coleslaw", allergens: [], dietary: [] },
      { name: "BBQ Chicken Wings", price: 8.99, category: "BBQ", description: "6 wings with ranch dip", allergens: ["dairy"], dietary: [] },
      { name: "Mac & Cheese", price: 6.99, category: "Sides", description: "Creamy macaroni with cheddar", allergens: ["dairy", "gluten"], dietary: ["vegetarian"] },
      { name: "Corn on the Cob", price: 4.99, category: "Sides", description: "Grilled corn with butter", allergens: ["dairy"], dietary: ["vegetarian"] },
      { name: "Sweet Tea", price: 2.99, category: "Drinks", description: "Southern-style sweetened iced tea", allergens: [], dietary: ["vegan", "vegetarian"] },
      { name: "Craft IPA", price: 5.99, category: "Drinks", description: "Local hoppy ale", allergens: ["gluten"], dietary: ["vegan", "vegetarian"] },
      { name: "Bourbon Lemonade", price: 7.99, category: "Drinks", description: "Kentucky bourbon with fresh lemonade", allergens: [], dietary: ["vegan", "vegetarian"] },
    ],
  },
  {
    name: "Sweet Treats",
    cuisine: "Desserts",
    imageUrl: "/images/desserts.jpg",
    collectionPoint: "Dessert Bar",
    items: [
      { name: "Vanilla Ice Cream", price: 4.99, category: "Ice Cream", description: "Two scoops of premium vanilla", allergens: ["dairy", "eggs"], dietary: ["vegetarian"] },
      { name: "Chocolate Fudge Sundae", price: 6.99, category: "Ice Cream", description: "Ice cream with hot fudge and whipped cream", allergens: ["dairy", "eggs"], dietary: ["vegetarian"] },
      { name: "Strawberry Cheesecake", price: 5.99, category: "Desserts", description: "New York style with fresh strawberries", allergens: ["dairy", "gluten", "eggs"], dietary: ["vegetarian"] },
      { name: "Vegan Chocolate Cake", price: 5.99, category: "Desserts", description: "Rich chocolate cake slice", allergens: ["gluten"], dietary: ["vegetarian", "vegan"] },
      { name: "Apple Crumble", price: 5.99, category: "Desserts", description: "Warm apple with cinnamon crumble", allergens: ["dairy", "gluten"], dietary: ["vegetarian"] },
      { name: "Hot Chocolate", price: 3.99, category: "Drinks", description: "Rich Belgian chocolate with whipped cream", allergens: ["dairy"], dietary: ["vegetarian"] },
      { name: "Espresso Affogato", price: 5.49, category: "Drinks", description: "Vanilla gelato drowned in espresso", allergens: ["dairy"], dietary: ["vegetarian"] },
      { name: "Strawberry Smoothie", price: 4.99, category: "Drinks", description: "Fresh strawberries blended with yogurt", allergens: ["dairy"], dietary: ["vegetarian"] },
    ],
  },
  {
    name: "3 Jays & D",
    cuisine: "Bar",
    imageUrl: "/logos/3-jays-d.png",
    collectionPoint: "The Bar",
    items: [
      // Beers
      { name: "Lager (Pint)", price: 5.49, category: "Beer", description: "Crisp and refreshing house lager", allergens: ["gluten"], dietary: ["vegan", "vegetarian"] },
      { name: "IPA (Pint)", price: 6.49, category: "Beer", description: "Hoppy craft IPA with citrus notes", allergens: ["gluten"], dietary: ["vegan", "vegetarian"] },
      { name: "Stout (Pint)", price: 6.29, category: "Beer", description: "Rich and creamy dark stout", allergens: ["gluten"], dietary: ["vegan", "vegetarian"] },
      { name: "Wheat Beer", price: 5.99, category: "Beer", description: "Belgian-style witbier with orange peel", allergens: ["gluten"], dietary: ["vegan", "vegetarian"] },
      { name: "Gluten-Free Lager", price: 5.99, category: "Beer", description: "Crisp lager, gluten-free certified", allergens: [], dietary: ["vegan", "vegetarian"] },
      // Wines
      { name: "House Red (Glass)", price: 6.99, category: "Wine", description: "Smooth Merlot from Chile", allergens: [], dietary: ["vegan", "vegetarian"] },
      { name: "House White (Glass)", price: 6.99, category: "Wine", description: "Crisp Sauvignon Blanc from New Zealand", allergens: [], dietary: ["vegan", "vegetarian"] },
      { name: "Prosecco (Glass)", price: 7.49, category: "Wine", description: "Italian sparkling wine", allergens: [], dietary: ["vegan", "vegetarian"] },
      { name: "Rosé (Glass)", price: 7.49, category: "Wine", description: "Provence-style dry rosé", allergens: [], dietary: ["vegan", "vegetarian"] },
      // Cocktails
      { name: "Mojito", price: 9.99, category: "Cocktails", description: "White rum, mint, lime, and soda", allergens: [], dietary: ["vegan", "vegetarian"] },
      { name: "Margarita", price: 9.99, category: "Cocktails", description: "Tequila, triple sec, and fresh lime", allergens: [], dietary: ["vegan", "vegetarian"] },
      { name: "Espresso Martini", price: 10.99, category: "Cocktails", description: "Vodka, coffee liqueur, and fresh espresso", allergens: [], dietary: ["vegan", "vegetarian"] },
      { name: "Piña Colada", price: 9.99, category: "Cocktails", description: "Rum, coconut cream, and pineapple", allergens: [], dietary: ["vegan", "vegetarian"] },
      { name: "Old Fashioned", price: 11.99, category: "Cocktails", description: "Bourbon, bitters, and orange zest", allergens: [], dietary: ["vegan", "vegetarian"] },
      { name: "Aperol Spritz", price: 9.49, category: "Cocktails", description: "Aperol, prosecco, and soda water", allergens: [], dietary: ["vegan", "vegetarian"] },
      { name: "Long Island Iced Tea", price: 10.99, category: "Cocktails", description: "Vodka, gin, rum, tequila, and cola", allergens: [], dietary: ["vegan", "vegetarian"] },
      // Spirits
      { name: "Single Malt Whisky", price: 8.99, category: "Spirits", description: "Highland single malt, neat or on the rocks", allergens: [], dietary: ["vegan", "vegetarian"] },
      { name: "Premium Gin & Tonic", price: 8.49, category: "Spirits", description: "Hendricks gin with cucumber tonic", allergens: [], dietary: ["vegan", "vegetarian"] },
      { name: "Rum & Coke", price: 6.99, category: "Spirits", description: "Bacardi with cola and lime", allergens: [], dietary: ["vegan", "vegetarian"] },
      { name: "Vodka & Cranberry", price: 6.99, category: "Spirits", description: "Premium vodka with cranberry juice", allergens: [], dietary: ["vegan", "vegetarian"] },
      // Non-Alcoholic
      { name: "Virgin Mojito", price: 5.99, category: "Mocktails", description: "All the flavor, none of the rum", allergens: [], dietary: ["vegan", "vegetarian"] },
      { name: "Alcohol-Free Beer", price: 4.49, category: "Mocktails", description: "Peroni 0.0%, full flavor", allergens: ["gluten"], dietary: ["vegan", "vegetarian"] },
      { name: "Fresh Orange Juice", price: 3.99, category: "Soft Drinks", description: "Freshly squeezed", allergens: [], dietary: ["vegan", "vegetarian"] },
      { name: "Sparkling Water", price: 2.99, category: "Soft Drinks", description: "San Pellegrino 500ml", allergens: [], dietary: ["vegan", "vegetarian"] },
      { name: "Coca-Cola", price: 2.99, category: "Soft Drinks", description: "Classic or Zero, your choice", allergens: [], dietary: ["vegan", "vegetarian"] },
      { name: "Ginger Beer", price: 3.49, category: "Soft Drinks", description: "Spicy Fever-Tree ginger beer", allergens: [], dietary: ["vegan", "vegetarian"] },
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
        collectionPoint: v.collectionPoint,
      },
    });
    
    for (const item of v.items) {
      await prisma.menuItem.create({
        data: {
          name: item.name,
          price: item.price,
          category: item.category,
          description: item.description ?? null,
          region: item.region ?? null,
          allergens: item.allergens,
          dietary: item.dietary,
          isVegan: item.dietary.includes("vegan"),
          available: true,
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
