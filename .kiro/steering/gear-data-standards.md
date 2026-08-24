---
inclusion: auto
---

# Gear Database — Data Standards

When adding new gear items to the Supabase `gear_items` table, every item MUST include the specs required for its subcategory. The compare page depends on this. We are at 100% coverage — do not break it.

## Required Specs by Subcategory

### Shelter
| Subcategory | Required |
|---|---|
| freestanding-tent | setup_type, floor_area, peak_height, fabric, capacity, seasons |
| trekking-pole-tent | setup_type, floor_area, peak_height, fabric, capacity, seasons |
| pyramid | capacity, seasons, fabric, floor_area, peak_height |
| tarp | capacity, seasons, fabric |
| tarp-system | capacity, seasons, fabric |
| hammock | capacity, seasons, fabric |
| bivy | capacity, seasons, fabric |

### Sleep
| Subcategory | Required |
|---|---|
| quilt | temp_rating, fill_type, sleep_style + fill_power (if down) |
| sleeping-bag | temp_rating, fill_type, sleep_style + fill_power (if down) |
| underquilt | temp_rating, fill_type + fill_power (if down) |
| pad-inflatable | r_value, thickness, pad_width, pad_length |
| pad-foam | r_value, thickness |
| pillow | weight + price only |
| liner | weight + price only |

### Pack
| Subcategory | Required |
|---|---|
| thru-hike | volume, frame_type, hip_belt |
| fast-light | volume, frame_type, hip_belt |
| daypack | volume |
| running-vest | volume |

### Kitchen
| Subcategory | Required |
|---|---|
| stove | fuel_type, boil_time |
| cookware, food, water-filter, water-storage, fuel, fire-signal | weight + price only |

### Electronics
| Subcategory | Required |
|---|---|
| headlamp | lumens, battery_type, runtime |
| power | battery_type |
| satellite | battery_type |
| gps-watch | battery_type |
| solar, camera, nav-app | weight + price only |

### Accessories
| Subcategory | Required |
|---|---|
| trekking-poles | pole_material, collapsed_length, lock_type, grip_material |
| rain-gear | waterproof |
| insulation | fill_type + fill_power (if down) |
| socks, camp-comfort, hammock-suspension, hygiene, stuff-sacks, sun-protection | weight + price only |

### Safety
All subcategories: weight + price only.

## Rules

1. Every item MUST have: id, name, brand, category, subcategory, tier, weight_oz, price_usd, description.
2. Every item MUST have the specs listed above for its subcategory.
3. Synthetic insulation items have `fill_type: "synthetic"` — they do NOT need `fill_power`.
4. Items that aren't gear (USB cables, compasses, phone bags) go under subcategory `none`.
5. Fuel canisters go under subcategory `fuel`, not `stove`.
6. After adding items, run `node scripts/audit-data.mjs` to verify 100% is maintained.
7. If bulk-adding items with missing specs, run `node scripts/enrich-database.mjs` to fill gaps via Gemini.
