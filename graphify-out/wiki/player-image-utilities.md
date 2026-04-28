# Player Image Utilities

*Community 18 · 3 nodes*

[← Back to index](index.md)

## Nodes

### playerImage.ts
- **Source:** `D:\compare\FPL_Dashboard\src\lib\playerImage.ts`
- **Type:** code
- **Connections:** 2
- **Edges:**
  - `contains` [EXTRACTED] → **getClubShirtUrl()**
  - `contains` [EXTRACTED] → **getPlayerPhotoUrl()**

### getClubShirtUrl()
- **Source:** `D:\compare\FPL_Dashboard\src\lib\playerImage.ts`
- **Type:** code
- **Connections:** 2
- **Edges:**
  - `contains` [EXTRACTED] → **playerImage.ts**
  - `calls` [EXTRACTED] → **getPlayerPhotoUrl()**

### getPlayerPhotoUrl()
- **Source:** `D:\compare\FPL_Dashboard\src\lib\playerImage.ts`
- **Type:** code
- **Connections:** 2
- **Edges:**
  - `contains` [EXTRACTED] → **playerImage.ts**
  - `calls` [EXTRACTED] → **getClubShirtUrl()**
