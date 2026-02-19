/**
 * Food Hall Concierge - AI-powered chatbot service
 * Handles dietary filtering, smart upselling, and group awareness
 */

const DIETARY_KEYWORDS = {
  vegan: { dietary: ['vegan'], excludeAllergens: [] },
  vegetarian: { dietary: ['vegetarian'], excludeAllergens: [] },
  'gluten-free': { dietary: [], excludeAllergens: ['gluten'] },
  'gluten free': { dietary: [], excludeAllergens: ['gluten'] },
  'no gluten': { dietary: [], excludeAllergens: ['gluten'] },
  'nut allergy': { dietary: [], excludeAllergens: ['nuts', 'peanuts', 'tree nuts'] },
  'nut-free': { dietary: [], excludeAllergens: ['nuts', 'peanuts', 'tree nuts'] },
  'no nuts': { dietary: [], excludeAllergens: ['nuts', 'peanuts', 'tree nuts'] },
  'dairy-free': { dietary: [], excludeAllergens: ['dairy', 'milk'] },
  'no dairy': { dietary: [], excludeAllergens: ['dairy', 'milk'] },
  'lactose': { dietary: [], excludeAllergens: ['dairy', 'milk'] },
};

const GROUP_KEYWORDS = ['group', 'family', 'party', 'team', 'friends', 'everyone', 'all of us', 'we all', 'sharing'];
const UPSELL_CATEGORIES = ['Drinks', 'Coffee', 'Sides', 'Desserts', 'Ice Cream', 'Pastries', 'Beer', 'Wine', 'Cocktails', 'Mocktails', 'Soft Drinks', 'Spirits'];
const BAR_KEYWORDS = ['drink', 'drinks', 'beer', 'wine', 'cocktail', 'cocktails', 'alcohol', 'booze', 'bar', 'lager', 'ale', 'cider', 'whisky', 'whiskey', 'gin', 'vodka', 'rum', 'mojito', 'margarita', 'martini', 'spritz', 'mocktail', 'non-alcoholic', 'soft drink', 'soda', 'juice', 'thirsty'];

class FoodHallConcierge {
  constructor(prisma, inMemoryDatabase = null) {
    this.prisma = prisma;
    this.inMemoryDb = inMemoryDatabase;
  }

  async getAllMenuItems() {
    if (this.prisma) {
      return await this.prisma.menuItem.findMany({
        where: { available: true },
        include: { vendor: true }
      });
    }
    
    if (this.inMemoryDb) {
      const items = [];
      this.inMemoryDb.menus.forEach((menu, vendorId) => {
        const vendor = this.inMemoryDb.vendors.get(vendorId);
        menu.forEach(item => {
          if (item.available !== false) {
            items.push({
              ...item,
              vendor: vendor,
              vendorId: vendorId
            });
          }
        });
      });
      return items;
    }
    
    return [];
  }

  async getVendors() {
    if (this.prisma) {
      return await this.prisma.vendor.findMany();
    }
    
    if (this.inMemoryDb) {
      return Array.from(this.inMemoryDb.vendors.values());
    }
    
    return [];
  }

  detectDietaryPreferences(message) {
    const lowerMessage = message.toLowerCase();
    const preferences = { dietary: [], excludeAllergens: [] };
    
    for (const [keyword, prefs] of Object.entries(DIETARY_KEYWORDS)) {
      if (lowerMessage.includes(keyword)) {
        preferences.dietary.push(...prefs.dietary);
        preferences.excludeAllergens.push(...prefs.excludeAllergens);
      }
    }
    
    return {
      dietary: [...new Set(preferences.dietary)],
      excludeAllergens: [...new Set(preferences.excludeAllergens)]
    };
  }

  detectGroupContext(message) {
    const lowerMessage = message.toLowerCase();
    return GROUP_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
  }

  detectItemSelection(message, menuItems) {
    const lowerMessage = message.toLowerCase();
    const selectedItems = [];
    
    for (const item of menuItems) {
      const itemNameLower = item.name.toLowerCase();
      if (lowerMessage.includes(itemNameLower) || 
          lowerMessage.includes(itemNameLower.split(' ')[0])) {
        selectedItems.push(item);
      }
    }
    
    return selectedItems;
  }

  filterMenuItems(items, preferences) {
    return items.filter(item => {
      const itemDietary = item.dietary || [];
      const itemAllergens = item.allergens || [];
      
      if (preferences.dietary.length > 0) {
        const hasDietary = preferences.dietary.some(d => itemDietary.includes(d));
        if (!hasDietary) return false;
      }
      
      if (preferences.excludeAllergens.length > 0) {
        const hasAllergen = preferences.excludeAllergens.some(a => 
          itemAllergens.some(ia => ia.toLowerCase().includes(a.toLowerCase()))
        );
        if (hasAllergen) return false;
      }
      
      return true;
    });
  }

  getUpsellSuggestions(selectedItem, allItems) {
    const otherVendorItems = allItems.filter(item => 
      item.vendorId !== selectedItem.vendorId &&
      UPSELL_CATEGORIES.some(cat => 
        item.category?.toLowerCase().includes(cat.toLowerCase())
      )
    );
    
    const shuffled = otherVendorItems.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }

  getGroupSuggestions(items) {
    const groupFriendly = items.filter(item => {
      const name = item.name.toLowerCase();
      const desc = (item.description || '').toLowerCase();
      return name.includes('platter') || 
             name.includes('sharing') || 
             name.includes('family') ||
             name.includes('bucket') ||
             name.includes('combo') ||
             desc.includes('serves') ||
             desc.includes('sharing') ||
             item.price > 15;
    });
    
    if (groupFriendly.length < 3) {
      const byCategory = {};
      items.forEach(item => {
        const cat = item.category || 'Other';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(item);
      });
      
      const suggestions = [];
      Object.values(byCategory).forEach(catItems => {
        if (catItems.length > 0) {
          suggestions.push(catItems[Math.floor(Math.random() * catItems.length)]);
        }
      });
      return suggestions.slice(0, 5);
    }
    
    return groupFriendly.slice(0, 5);
  }

  formatPrice(price) {
    return `£${price.toFixed(2)}`;
  }

  formatItemResponse(item) {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      formattedPrice: this.formatPrice(item.price),
      category: item.category,
      vendorId: item.vendorId || item.vendor?.id,
      vendorName: item.vendorName || item.vendor?.name,
      dietary: item.dietary || [],
      allergens: item.allergens || [],
      isVegan: item.dietary?.includes('vegan') || item.isVegan,
      isVegetarian: item.dietary?.includes('vegetarian')
    };
  }

  generateGreeting(isGroupSession) {
    const greetings = [
      "Welcome to the Food Hall! I'm your personal concierge.",
      "Hello! I'm here to help you discover delicious options from all our vendors.",
      "Good day! Let me be your guide to the wonderful flavours we have on offer."
    ];
    
    let greeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    if (isGroupSession) {
      greeting += " I notice you're ordering as a group — wonderful! I can suggest sharing platters and variety options that work brilliantly for groups.";
    } else {
      greeting += " Whether you have dietary preferences or you're simply looking for something delicious, I'm here to assist.";
    }
    
    return greeting;
  }

  async processMessage(message, context = {}) {
    const { sessionId, groupId, previousSelections = [] } = context;
    const isGroupSession = !!groupId || this.detectGroupContext(message);
    
    const allItems = await this.getAllMenuItems();
    const vendors = await this.getVendors();
    
    const lowerMessage = message.toLowerCase();
    
    const response = {
      text: '',
      menuItems: [],
      suggestions: [],
      upsells: [],
      isGroupContext: isGroupSession,
      dietaryFiltersApplied: [],
      allergenFiltersApplied: []
    };

    if (lowerMessage.match(/^(hi|hello|hey|good morning|good afternoon|good evening|help)/)) {
      response.text = this.generateGreeting(isGroupSession);
      response.suggestions = [
        "Show me vegan options",
        "What's popular today?",
        "🍸 Show drinks menu",
        "Show all vendors"
      ];
      if (isGroupSession) {
        response.suggestions.unshift("Suggest sharing platters");
      }
      return response;
    }

    const preferences = this.detectDietaryPreferences(message);
    let filteredItems = allItems;
    
    if (preferences.dietary.length > 0 || preferences.excludeAllergens.length > 0) {
      filteredItems = this.filterMenuItems(allItems, preferences);
      response.dietaryFiltersApplied = preferences.dietary;
      response.allergenFiltersApplied = preferences.excludeAllergens;
    }

    if (isGroupSession && (lowerMessage.includes('group') || lowerMessage.includes('sharing') || lowerMessage.includes('family'))) {
      const groupItems = this.getGroupSuggestions(filteredItems);
      response.menuItems = groupItems.map(item => this.formatItemResponse(item));
      response.text = `Excellent choice for a group gathering! Here are some wonderful options perfect for sharing. These selections offer great variety and value for groups:`;
      response.suggestions = ["Add variety combo", "See individual portions", "Dietary requirements?"];
      return response;
    }

    const selectedItems = this.detectItemSelection(message, allItems);
    if (selectedItems.length > 0) {
      const selected = selectedItems[0];
      const upsells = this.getUpsellSuggestions(selected, filteredItems);
      
      response.menuItems = [this.formatItemResponse(selected)];
      response.upsells = upsells.map(item => this.formatItemResponse(item));
      
      response.text = `Excellent choice! The ${selected.name} from ${selected.vendor?.name || selected.vendorName} is a wonderful selection at ${this.formatPrice(selected.price)}.`;
      
      if (upsells.length > 0) {
        response.text += ` May I suggest pairing it with one of these complementary items from our other vendors?`;
      }
      
      response.suggestions = ["Add to cart", "Show similar items", "See full menu"];
      return response;
    }

    if (preferences.dietary.length > 0 || preferences.excludeAllergens.length > 0) {
      const displayItems = filteredItems.slice(0, 8);
      response.menuItems = displayItems.map(item => this.formatItemResponse(item));
      
      const filterDesc = [];
      if (preferences.dietary.length > 0) {
        filterDesc.push(preferences.dietary.join(' and '));
      }
      if (preferences.excludeAllergens.length > 0) {
        filterDesc.push(`free from ${preferences.excludeAllergens.join(', ')}`);
      }
      
      response.text = `Absolutely, I understand the importance of dietary requirements. Here are ${filteredItems.length} options that are ${filterDesc.join(' and ')}. Each has been carefully selected to meet your needs:`;
      
      if (filteredItems.length === 0) {
        response.text = `I apologise, but I couldn't find items matching all your dietary requirements. Would you like me to show options that meet some of your criteria, or shall I check with our vendors for special accommodations?`;
        response.suggestions = ["Show closest matches", "Contact vendor", "Other dietary needs"];
      } else {
        response.suggestions = ["Show more options", "Filter by cuisine", "Add to cart"];
      }
      
      return response;
    }

    if (lowerMessage.includes('popular') || lowerMessage.includes('recommend') || lowerMessage.includes('best')) {
      const popular = filteredItems
        .sort(() => 0.5 - Math.random())
        .slice(0, 6);
      response.menuItems = popular.map(item => this.formatItemResponse(item));
      response.text = "These are some of our most beloved dishes, highly recommended by our guests:";
      response.suggestions = ["Show vegan options", "🍸 Drinks menu", "See all desserts", "View by vendor"];
      return response;
    }

    if (lowerMessage.includes('vendor') || lowerMessage.includes('restaurant') || lowerMessage.includes('stall')) {
      response.text = `We have ${vendors.length} wonderful vendors in our food hall: ${vendors.map(v => v.name).join(', ')}. Each brings their unique culinary expertise. Which cuisine interests you?`;
      response.suggestions = vendors.slice(0, 4).map(v => v.name);
      return response;
    }

    const vendorMatch = vendors.find(v => 
      lowerMessage.includes(v.name.toLowerCase()) ||
      lowerMessage.includes(v.cuisine?.toLowerCase())
    );
    
    if (vendorMatch) {
      const vendorItems = filteredItems.filter(item => 
        (item.vendorId === vendorMatch.id) || (item.vendor?.id === vendorMatch.id)
      );
      response.menuItems = vendorItems.slice(0, 8).map(item => this.formatItemResponse(item));
      response.text = `${vendorMatch.name} offers an excellent selection of ${vendorMatch.cuisine} cuisine. Here's what they have available:`;
      response.suggestions = ["Add to cart", "Show other vendors", "Dietary options"];
      return response;
    }

    // Check for bar/drinks queries
    const isDrinkQuery = BAR_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
    if (isDrinkQuery) {
      const drinkCategories = ['beer', 'wine', 'cocktails', 'spirits', 'mocktails', 'soft drinks', 'drinks', 'coffee'];
      const drinkItems = filteredItems.filter(item =>
        drinkCategories.some(cat => item.category?.toLowerCase().includes(cat)) ||
        item.vendor?.cuisine?.toLowerCase() === 'bar' ||
        item.vendor?.name?.toLowerCase().includes('jay')
      );
      
      // Determine what type of drink they're looking for
      let drinkType = 'drinks';
      if (lowerMessage.includes('beer') || lowerMessage.includes('lager') || lowerMessage.includes('ale')) drinkType = 'beers';
      else if (lowerMessage.includes('wine') || lowerMessage.includes('prosecco') || lowerMessage.includes('rosé')) drinkType = 'wines';
      else if (lowerMessage.includes('cocktail') || lowerMessage.includes('mojito') || lowerMessage.includes('margarita')) drinkType = 'cocktails';
      else if (lowerMessage.includes('mocktail') || lowerMessage.includes('non-alcoholic') || lowerMessage.includes('soft')) drinkType = 'non-alcoholic drinks';
      else if (lowerMessage.includes('whisky') || lowerMessage.includes('gin') || lowerMessage.includes('vodka') || lowerMessage.includes('rum')) drinkType = 'spirits';
      
      // Filter by specific drink type if mentioned
      let displayItems = drinkItems;
      if (drinkType !== 'drinks') {
        const typeFiltered = drinkItems.filter(item => 
          item.category?.toLowerCase().includes(drinkType.replace('s', '')) ||
          item.name?.toLowerCase().includes(drinkType.replace('s', ''))
        );
        if (typeFiltered.length > 0) displayItems = typeFiltered;
      }
      
      response.menuItems = displayItems.slice(0, 10).map(item => this.formatItemResponse(item));
      response.text = displayItems.length > 0
        ? `🍸 Here's our ${drinkType} selection from 3 Jays & D bar and other vendors. We've got everything from craft beers to signature cocktails:`
        : `I couldn't find ${drinkType} at the moment. Let me show you what's available:`;
      
      if (displayItems.length === 0) {
        response.menuItems = filteredItems.slice(0, 6).map(item => this.formatItemResponse(item));
      }
      
      response.suggestions = ["Show beers", "Show cocktails", "Non-alcoholic options", "See food menu"];
      return response;
    }

    const categoryKeywords = ['pizza', 'burger', 'taco', 'curry', 'coffee', 'dessert', 'ice cream', 'bbq', 'fish', 'chips', 'salad'];
    const matchedCategory = categoryKeywords.find(cat => lowerMessage.includes(cat));
    
    if (matchedCategory) {
      const categoryItems = filteredItems.filter(item =>
        item.category?.toLowerCase().includes(matchedCategory) ||
        item.name.toLowerCase().includes(matchedCategory)
      );
      response.menuItems = categoryItems.slice(0, 8).map(item => this.formatItemResponse(item));
      response.text = categoryItems.length > 0
        ? `Here are our ${matchedCategory} options from across the food hall:`
        : `I couldn't find ${matchedCategory} items, but here are some alternatives you might enjoy:`;
      
      if (categoryItems.length === 0) {
        response.menuItems = filteredItems.slice(0, 6).map(item => this.formatItemResponse(item));
      }
      
      response.suggestions = ["Show similar items", "Add to cart", "Other categories"];
      return response;
    }

    response.text = "I'd be delighted to help you find the perfect meal or drink. You can ask me about specific cuisines, dietary requirements, or let me recommend some favourites. What would you like to explore?";
    response.suggestions = [
      "What's popular?",
      "🍸 Drinks menu",
      "Vegan options",
      "Show all vendors"
    ];
    
    if (isGroupSession) {
      response.suggestions.unshift("Group sharing platters");
    }
    
    return response;
  }
}

function createConciergeRoutes(app, prisma, database) {
  const concierge = new FoodHallConcierge(prisma, database);

  app.post('/api/concierge', async (req, res) => {
    try {
      const { message, sessionId, groupId, previousSelections } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      const response = await concierge.processMessage(message, {
        sessionId,
        groupId,
        previousSelections
      });
      
      res.json(response);
    } catch (error) {
      console.error('Concierge error:', error);
      res.status(500).json({ 
        error: 'I apologise, but I encountered an issue. Please try again.',
        text: "I'm sorry, I'm having a moment. Could you please repeat that?"
      });
    }
  });

  app.get('/api/concierge/dietary-options', (req, res) => {
    res.json({
      dietary: ['vegan', 'vegetarian'],
      allergens: ['gluten', 'dairy', 'nuts', 'fish', 'eggs', 'soy'],
      keywords: Object.keys(DIETARY_KEYWORDS)
    });
  });
}

module.exports = { FoodHallConcierge, createConciergeRoutes };
