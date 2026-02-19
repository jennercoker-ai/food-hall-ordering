import { prisma } from '@/lib/prisma';
import type { MenuItem, ConciergeResponse } from '@/lib/types';

const DIETARY_KEYWORDS: Record<string, { dietary: string[]; excludeAllergens: string[] }> = {
  vegan: { dietary: ['vegan'], excludeAllergens: [] },
  vegetarian: { dietary: ['vegetarian'], excludeAllergens: [] },
  'gluten-free': { dietary: [], excludeAllergens: ['gluten'] },
  'gluten free': { dietary: [], excludeAllergens: ['gluten'] },
  'no gluten': { dietary: [], excludeAllergens: ['gluten'] },
  'nut allergy': { dietary: [], excludeAllergens: ['nuts', 'peanuts', 'tree nuts'] },
  'nut-free': { dietary: [], excludeAllergens: ['nuts', 'peanuts'] },
  'dairy-free': { dietary: [], excludeAllergens: ['dairy', 'milk'] },
  'no dairy': { dietary: [], excludeAllergens: ['dairy', 'milk'] },
  lactose: { dietary: [], excludeAllergens: ['dairy', 'milk'] },
};

const GROUP_KEYWORDS = ['group', 'family', 'party', 'team', 'friends', 'everyone', 'sharing', 'we all'];
const BAR_KEYWORDS = ['drink', 'drinks', 'beer', 'wine', 'cocktail', 'alcohol', 'bar', 'lager', 'ale', 'cider', 'whisky', 'gin', 'vodka', 'rum', 'mojito', 'margarita', 'mocktail', 'soda', 'thirsty'];
const UPSELL_CATEGORIES = ['Drinks', 'Coffee', 'Sides', 'Desserts', 'Beer', 'Wine', 'Cocktails', 'Mocktails', 'Soft Drinks', 'Spirits'];

type MenuItemWithVendor = MenuItem & { vendor: { id: string; name: string } | null };

async function getAllMenuItems(): Promise<MenuItemWithVendor[]> {
  const items = await prisma.menuItem.findMany({
    where: { available: true },
    include: { vendor: { select: { id: true, name: true } } },
  });
  return items as unknown as MenuItemWithVendor[];
}

function detectDietary(msg: string) {
  const lower = msg.toLowerCase();
  const dietary: string[] = [];
  const excludeAllergens: string[] = [];
  for (const [kw, prefs] of Object.entries(DIETARY_KEYWORDS)) {
    if (lower.includes(kw)) {
      dietary.push(...prefs.dietary);
      excludeAllergens.push(...prefs.excludeAllergens);
    }
  }
  return {
    dietary: [...new Set(dietary)],
    excludeAllergens: [...new Set(excludeAllergens)],
  };
}

function filterItems<T extends { dietary: string[]; allergens: string[] }>(
  items: T[],
  { dietary, excludeAllergens }: { dietary: string[]; excludeAllergens: string[] },
): T[] {
  return items.filter((item) => {
    if (dietary.length > 0 && !dietary.some((d) => item.dietary.includes(d))) return false;
    if (excludeAllergens.length > 0 && excludeAllergens.some((a) =>
      item.allergens.some((ia) => ia.toLowerCase().includes(a.toLowerCase()))
    )) return false;
    return true;
  });
}

function getUpsells<T extends { vendorId: string; category: string }>(selected: T, all: T[]): T[] {
  return all
    .filter((i) => i.vendorId !== selected.vendorId && UPSELL_CATEGORIES.some((c) => i.category?.toLowerCase().includes(c.toLowerCase())))
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);
}

function formatItem(item: MenuItem & { vendor?: { id: string; name: string } | null }): MenuItem {
  return {
    ...item,
    vendorId: item.vendorId || item.vendor?.id || '',
  };
}

export async function processMessage(
  message: string,
  context: { groupId?: string; isGroupSession?: boolean } = {},
): Promise<ConciergeResponse> {
  const lower = message.toLowerCase();
  const isGroup = !!context.groupId || GROUP_KEYWORDS.some((k) => lower.includes(k));
  const items = await getAllMenuItems();

  const base: ConciergeResponse = {
    text: '',
    menuItems: [],
    suggestions: [],
    upsells: [],
    isGroupContext: isGroup,
    dietaryFiltersApplied: [],
    allergenFiltersApplied: [],
  };

  // Greeting
  if (/^(hi|hello|hey|good\s|help|start)/i.test(lower)) {
    base.text = isGroup
      ? "Welcome! I can see you're ordering as a group — wonderful! I can suggest sharing platters, variety picks, and make sure everyone's dietary needs are covered."
      : "Welcome to the Food Hall! I'm your personal concierge. Tell me what you're in the mood for, any dietary requirements, or let me suggest something great.";
    base.suggestions = isGroup
      ? ['Suggest sharing platters', 'Vegan options', '🍸 Drinks menu', 'Show all vendors']
      : ['What\'s popular today?', 'Show vegan options', '🍸 Drinks', 'Nut-free options'];
    return base;
  }

  // Bar / drinks query
  if (BAR_KEYWORDS.some((k) => lower.includes(k))) {
    const drinkItems = items.filter((i) =>
      ['Beer', 'Wine', 'Cocktails', 'Mocktails', 'Spirits', 'Soft Drinks', 'Drinks', 'Bar'].some((c) =>
        i.category?.toLowerCase().includes(c.toLowerCase())
      )
    );
    base.menuItems = drinkItems.slice(0, 8).map(formatItem);
    base.text = `Here's our full drinks selection from the bar${drinkItems.length > 8 ? ` (showing 8 of ${drinkItems.length})` : ''}:`;
    base.suggestions = ['Cocktails only', 'Non-alcoholic options', 'Add to cart'];
    return base;
  }

  const preferences = detectDietary(lower);
  let filtered = items;

  if (preferences.dietary.length > 0 || preferences.excludeAllergens.length > 0) {
    filtered = filterItems(items, preferences);
    base.dietaryFiltersApplied = preferences.dietary;
    base.allergenFiltersApplied = preferences.excludeAllergens;
    base.menuItems = filtered.slice(0, 8).map(formatItem);
    const labels = [...preferences.dietary, ...preferences.excludeAllergens.map((a) => `no ${a}`)];
    base.text = `Here are ${filtered.length} dishes that match your requirements (${labels.join(', ')}):`;
    base.suggestions = ['Show all options', 'Group-friendly picks', '🍸 Drinks'];
    return base;
  }

  // Group / sharing
  if (isGroup && ['sharing', 'group', 'family', 'platter'].some((k) => lower.includes(k))) {
    const groupPicks = items
      .filter((i) => {
        const n = i.name.toLowerCase();
        return n.includes('platter') || n.includes('sharing') || n.includes('combo') || (i.price > 12);
      })
      .slice(0, 6)
      .map(formatItem);
    base.menuItems = groupPicks;
    base.text = `Great for groups! Here are shareable options across our vendors:`;
    base.suggestions = ['Dietary requirements?', 'Individual portions', 'Show drinks'];
    return base;
  }

  // Allergen info for specific item
  if (['allergen', 'contains', 'allergy', 'safe for', 'intolerance'].some((k) => lower.includes(k))) {
    const mentionedItem = items.find((i) => lower.includes(i.name.toLowerCase()));
    if (mentionedItem) {
      const allergenList = mentionedItem.allergens.length
        ? mentionedItem.allergens.join(', ')
        : 'none listed';
      const dietaryList = mentionedItem.dietary.length
        ? mentionedItem.dietary.join(', ')
        : 'none listed';
      base.menuItems = [formatItem(mentionedItem)];
      base.text = `**${mentionedItem.name}** allergens: **${allergenList}**. Dietary: ${dietaryList}.`;
      base.suggestions = ['Show similar items', 'Gluten-free options', 'Vegan options'];
      return base;
    }
  }

  // Pairing / item selection
  const selectedItem = items.find((i) => lower.includes(i.name.toLowerCase().split(' ')[0]));
  if (selectedItem) {
    const upsells = getUpsells(selectedItem, filtered);
    base.menuItems = [formatItem(selectedItem)];
    base.upsells = upsells.map(formatItem);
    const vendorName = selectedItem.vendor?.name ?? 'us';
    base.text = `Great choice! **${selectedItem.name}** from ${vendorName} is £${selectedItem.price.toFixed(2)}.`;
    if (upsells.length) base.text += ` Here are some perfect pairings from our other vendors:`;
    base.suggestions = ['Add to cart', 'Show full menu', 'See allergens'];
    return base;
  }

  // Popular / fallback
  const popular = items.sort(() => 0.5 - Math.random()).slice(0, 6).map(formatItem);
  base.menuItems = popular;
  base.text = "Here's a selection of our most popular dishes across all vendors today:";
  base.suggestions = ['Show vegan options', '🍸 Drinks menu', 'Group suggestions', 'Filter by allergen'];
  return base;
}
