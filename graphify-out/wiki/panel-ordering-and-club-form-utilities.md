# Panel Ordering & Club Form Utilities

*Community 1 · 35 nodes*

[← Back to index](index.md)

## Nodes

### GET()
- **Source:** `D:\compare\FPL_Dashboard\src\app\api\v1\user\transfers\route.ts`
- **Type:** code
- **Connections:** 22
- **Edges:**
  - `calls` [INFERRED] → **proxy()**
  - `calls` [INFERRED] → **POST()**
  - `contains` [EXTRACTED] → **route.ts**
  - `contains` [EXTRACTED] → **route.ts**
  - `contains` [EXTRACTED] → **route.ts**
  - `contains` [EXTRACTED] → **route.ts**
  - `contains` [EXTRACTED] → **route.ts**
  - `contains` [EXTRACTED] → **route.ts**

### POST()
- **Source:** `D:\compare\FPL_Dashboard\src\app\api\v1\squad\optimize\route.ts`
- **Type:** code
- **Connections:** 4
- **Edges:**
  - `contains` [EXTRACTED] → **route.ts**
  - `contains` [EXTRACTED] → **route.ts**
  - `contains` [EXTRACTED] → **route.ts**
  - `calls` [INFERRED] → **GET()**

### PUT()
- **Source:** `D:\compare\FPL_Dashboard\src\app\api\v1\user\preferences\route.ts`
- **Type:** code
- **Connections:** 4
- **Edges:**
  - `contains` [EXTRACTED] → **route.ts**
  - `calls` [EXTRACTED] → **getUserIdFromCookie()**
  - `calls` [INFERRED] → **normalizeSectionPreferences()**
  - `calls` [INFERRED] → **buildPanelOrderPayload()**

### panelOrder.ts
- **Source:** `D:\compare\FPL_Dashboard\src\lib\panelOrder.ts`
- **Type:** code
- **Connections:** 4
- **Edges:**
  - `contains` [EXTRACTED] → **mergeOrder()**
  - `contains` [EXTRACTED] → **extractPanelOrders()**
  - `contains` [EXTRACTED] → **buildPanelOrderPayload()**
  - `contains` [EXTRACTED] → **moveItem()**

### proxy()
- **Source:** `D:\compare\FPL_Dashboard\src\proxy.ts`
- **Type:** code
- **Connections:** 3
- **Edges:**
  - `contains` [EXTRACTED] → **proxy.ts**
  - `calls` [INFERRED] → **GET()**
  - `calls` [INFERRED] → **rateLimit()**

### route.ts
- **Source:** `D:\compare\FPL_Dashboard\src\app\api\v1\user\preferences\route.ts`
- **Type:** code
- **Connections:** 3
- **Edges:**
  - `contains` [EXTRACTED] → **GET()**
  - `contains` [EXTRACTED] → **getUserIdFromCookie()**
  - `contains` [EXTRACTED] → **PUT()**

### getUserIdFromCookie()
- **Source:** `D:\compare\FPL_Dashboard\src\app\api\v1\user\preferences\route.ts`
- **Type:** code
- **Connections:** 3
- **Edges:**
  - `calls` [EXTRACTED] → **GET()**
  - `contains` [EXTRACTED] → **route.ts**
  - `calls` [EXTRACTED] → **PUT()**

### rateLimit()
- **Source:** `D:\compare\FPL_Dashboard\src\lib\rateLimit.ts`
- **Type:** code
- **Connections:** 3
- **Edges:**
  - `calls` [INFERRED] → **proxy()**
  - `calls` [INFERRED] → **GET()**
  - `contains` [EXTRACTED] → **rateLimit.ts**

### normalizeSectionPreferences()
- **Source:** `D:\compare\FPL_Dashboard\src\lib\sectionPreferences.ts`
- **Type:** code
- **Connections:** 3
- **Edges:**
  - `calls` [INFERRED] → **GET()**
  - `calls` [INFERRED] → **PUT()**
  - `contains` [EXTRACTED] → **sectionPreferences.ts**

### route.ts
- **Source:** `D:\compare\FPL_Dashboard\src\app\api\v1\squad\live\route.ts`
- **Type:** code
- **Connections:** 2
- **Edges:**
  - `contains` [EXTRACTED] → **GET()**
  - `contains` [EXTRACTED] → **getBootstrap()**

### getBootstrap()
- **Source:** `D:\compare\FPL_Dashboard\src\app\api\v1\squad\live\route.ts`
- **Type:** code
- **Connections:** 2
- **Edges:**
  - `calls` [EXTRACTED] → **GET()**
  - `contains` [EXTRACTED] → **route.ts**

### buildClubFormMap()
- **Source:** `D:\compare\FPL_Dashboard\src\lib\clubForm.ts`
- **Type:** code
- **Connections:** 2
- **Edges:**
  - `calls` [INFERRED] → **GET()**
  - `contains` [EXTRACTED] → **clubForm.ts**

### extractPanelOrders()
- **Source:** `D:\compare\FPL_Dashboard\src\lib\panelOrder.ts`
- **Type:** code
- **Connections:** 2
- **Edges:**
  - `calls` [INFERRED] → **GET()**
  - `contains` [EXTRACTED] → **panelOrder.ts**

### buildPanelOrderPayload()
- **Source:** `D:\compare\FPL_Dashboard\src\lib\panelOrder.ts`
- **Type:** code
- **Connections:** 2
- **Edges:**
  - `calls` [INFERRED] → **PUT()**
  - `contains` [EXTRACTED] → **panelOrder.ts**

### proxy.ts
- **Source:** `D:\compare\FPL_Dashboard\src\proxy.ts`
- **Type:** code
- **Connections:** 1
- **Edges:**
  - `contains` [EXTRACTED] → **proxy()**

### route.ts
- **Source:** `D:\compare\FPL_Dashboard\src\app\api\v1\auth\login\route.ts`
- **Type:** code
- **Connections:** 1
- **Edges:**
  - `contains` [EXTRACTED] → **POST()**

### route.ts
- **Source:** `D:\compare\FPL_Dashboard\src\app\api\v1\auth\logout\route.ts`
- **Type:** code
- **Connections:** 1
- **Edges:**
  - `contains` [EXTRACTED] → **POST()**

### route.ts
- **Source:** `D:\compare\FPL_Dashboard\src\app\api\v1\cron\evaluate\route.ts`
- **Type:** code
- **Connections:** 1
- **Edges:**
  - `contains` [EXTRACTED] → **GET()**

### route.ts
- **Source:** `D:\compare\FPL_Dashboard\src\app\api\v1\fixtures\route.ts`
- **Type:** code
- **Connections:** 1
- **Edges:**
  - `contains` [EXTRACTED] → **GET()**

### route.ts
- **Source:** `D:\compare\FPL_Dashboard\src\app\api\v1\leagues\route.ts`
- **Type:** code
- **Connections:** 1
- **Edges:**
  - `contains` [EXTRACTED] → **GET()**

### route.ts
- **Source:** `D:\compare\FPL_Dashboard\src\app\api\v1\leagues\compare\route.ts`
- **Type:** code
- **Connections:** 1
- **Edges:**
  - `contains` [EXTRACTED] → **GET()**

### route.ts
- **Source:** `D:\compare\FPL_Dashboard\src\app\api\v1\leagues\live\route.ts`
- **Type:** code
- **Connections:** 1
- **Edges:**
  - `contains` [EXTRACTED] → **GET()**

### route.ts
- **Source:** `D:\compare\FPL_Dashboard\src\app\api\v1\player-photo\route.ts`
- **Type:** code
- **Connections:** 1
- **Edges:**
  - `contains` [EXTRACTED] → **GET()**

### route.ts
- **Source:** `D:\compare\FPL_Dashboard\src\app\api\v1\rank-projection\route.ts`
- **Type:** code
- **Connections:** 1
- **Edges:**
  - `contains` [EXTRACTED] → **GET()**

### route.ts
- **Source:** `D:\compare\FPL_Dashboard\src\app\api\v1\squad\optimize\route.ts`
- **Type:** code
- **Connections:** 1
- **Edges:**
  - `contains` [EXTRACTED] → **POST()**

### route.ts
- **Source:** `D:\compare\FPL_Dashboard\src\app\api\v1\squad\suggestions\route.ts`
- **Type:** code
- **Connections:** 1
- **Edges:**
  - `contains` [EXTRACTED] → **GET()**

### route.ts
- **Source:** `D:\compare\FPL_Dashboard\src\app\api\v1\sync\route.ts`
- **Type:** code
- **Connections:** 1
- **Edges:**
  - `contains` [EXTRACTED] → **GET()**

### route.ts
- **Source:** `D:\compare\FPL_Dashboard\src\app\api\v1\user\history\route.ts`
- **Type:** code
- **Connections:** 1
- **Edges:**
  - `contains` [EXTRACTED] → **GET()**

### route.ts
- **Source:** `D:\compare\FPL_Dashboard\src\app\api\v1\user\summary\route.ts`
- **Type:** code
- **Connections:** 1
- **Edges:**
  - `contains` [EXTRACTED] → **GET()**

### route.ts
- **Source:** `D:\compare\FPL_Dashboard\src\app\api\v1\user\transfers\route.ts`
- **Type:** code
- **Connections:** 1
- **Edges:**
  - `contains` [EXTRACTED] → **GET()**

### clubForm.ts
- **Source:** `D:\compare\FPL_Dashboard\src\lib\clubForm.ts`
- **Type:** code
- **Connections:** 1
- **Edges:**
  - `contains` [EXTRACTED] → **buildClubFormMap()**

### mergeOrder()
- **Source:** `D:\compare\FPL_Dashboard\src\lib\panelOrder.ts`
- **Type:** code
- **Connections:** 1
- **Edges:**
  - `contains` [EXTRACTED] → **panelOrder.ts**

### moveItem()
- **Source:** `D:\compare\FPL_Dashboard\src\lib\panelOrder.ts`
- **Type:** code
- **Connections:** 1
- **Edges:**
  - `contains` [EXTRACTED] → **panelOrder.ts**

### rateLimit.ts
- **Source:** `D:\compare\FPL_Dashboard\src\lib\rateLimit.ts`
- **Type:** code
- **Connections:** 1
- **Edges:**
  - `contains` [EXTRACTED] → **rateLimit()**

### sectionPreferences.ts
- **Source:** `D:\compare\FPL_Dashboard\src\lib\sectionPreferences.ts`
- **Type:** code
- **Connections:** 1
- **Edges:**
  - `contains` [EXTRACTED] → **normalizeSectionPreferences()**
