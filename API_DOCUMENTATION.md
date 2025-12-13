# Todo List API Documentation

## Base URL
```
http://localhost:5000/api
```

---

## 1. AGENTS ENDPOINTS

### Get All Agents
**GET** `/agents`
- Query: `?name=xxx&email=xxx`
- Returns: List of all agents (password excluded)

### Get Agent by Name
**GET** `/agents/name/:name`
- Params: `name` - Agent name (case-insensitive)
- Returns: Single agent object

### Create Agent
**POST** `/agents`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Update Agent by Name
**PUT** `/agents/name/:name`
```json
{
  "name": "New Name",
  "email": "newemail@example.com"
}
```

### Delete Agent by Name
**DELETE** `/agents/name/:name`
- Deletes agent and all associated spaces/checklists/items/steps

### Login Agent
**POST** `/agents/login`
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
- Returns: Agent data with `id`, `name`, `email`, `spaces`

---

## 2. SPACES ENDPOINTS

### Get All Spaces
**GET** `/spaces`
- Query: `?title=xxx&agent_id=xxx`
- Returns: All spaces with populated checklists

### Get Spaces by Agent Name
**GET** `/spaces/agent/name/:agentName`
- Params: `agentName` - Agent name
- Returns: Spaces for specific agent with nested checklists and items

### Get Space by Title
**GET** `/spaces/title/:title`
- Params: `title` - Space title (case-insensitive)
- Returns: Single space with checklists

### Create Space
**POST** `/spaces`
```json
{
  "space_title": "My Space",
  "agent_id": "agent_id_here"
}
```

### Update Space by Title
**PUT** `/spaces/title/:title`
```json
{
  "space_title": "Updated Space Title"
}
```

### Delete Space by Title
**DELETE** `/spaces/title/:title`
- Deletes space and all nested checklists/items/steps

---

## 3. CHECKLISTS ENDPOINTS

### Get All Checklists
**GET** `/checklists`
- Query: `?title=xxx&space_id=xxx`
- Returns: All checklists with items

### Get Checklists by Space Name
**GET** `/checklists/space/:spaceName`
- Params: `spaceName` - Space name
- Returns: Checklists with statistics (total items, completed, etc.)

### Get Checklist by Title
**GET** `/checklists/title/:title`
- Params: `title` - Checklist title
- Returns: Single checklist with items

### Create Checklist
**POST** `/checklists`
```json
{
  "checklist_title": "My Checklist",
  "space_title": "My Space"
}
```

### Update Checklist by Title
**PUT** `/checklists/title/:title`
```json
{
  "checklist_title": "Updated Checklist"
}
```

### Delete Checklist by Title
**DELETE** `/checklists/title/:title`
- Deletes checklist and all items/steps

---

## 4. ITEMS ENDPOINTS

### Get All Items
**GET** `/items`
- Query: `?name=xxx&status=xxx&priority=xxx&checklist_id=xxx`
- Returns: All items with steps and categories

### Get Items by Checklist Name
**GET** `/items/checklist/:checklistName`
- Params: `checklistName` - Checklist name
- Returns: Items with statistics and nested steps

### Get Item by Name
**GET** `/items/name/:name`
- Params: `name` - Item name
- Returns: Single item with steps

### Create Item
**POST** `/items`
```json
{
  "name": "Task Name",
  "checklist_id": "checklist_id_here",
  "description": "Task description",
  "priority": "High",
  "deadline": "2025-12-31",
  "status": "Pending",
  "category_id": null
}
```

### Update Item by Name
**PUT** `/items/name/:name`
```json
{
  "description": "Updated description",
  "priority": "High",
  "deadline": "2025-12-31",
  "status": "In Progress"
}
```

### Update Item Progress
**PUT** `/items/:id/progress`
```json
{
  "progress": 50
}
```
- Returns: Updated item with new status

### Delete Item by Name
**DELETE** `/items/name/:name`
- Deletes item and all associated steps

---

## 5. STEPS ENDPOINTS

### Get All Steps
**GET** `/steps`
- Query: `?name=xxx&status=xxx&item_id=xxx`
- Returns: All steps

### Get Steps by Item Name
**GET** `/steps/item/:itemName`
- Params: `itemName` - Item name
- Returns: Steps for specific item

### Get Step by Name
**GET** `/steps/name/:name`
- Params: `name` - Step name
- Returns: Single step

### Create Step
**POST** `/steps`
```json
{
  "step_name": "Step description",
  "item_id": "item_id_here"
}
```
- Note: Status defaults to "Pending"

### Update Step by Name
**PUT** `/steps/name/:name`
```json
{
  "step_name": "Updated step",
  "status": "Completed"
}
```

### Update Step Status
**PUT** `/steps/:id/status`
```json
{
  "status": "Completed"
}
```

### Delete Step by Name
**DELETE** `/steps/name/:name`
- Deletes step

---

## 6. CATEGORIES ENDPOINTS

### Get All Categories
**GET** `/categories`
- Query: `?name=xxx`
- Returns: All categories with items

### Get Category by Name
**GET** `/categories/name/:name`
- Params: `name` - Category name
- Returns: Single category with items

### Create Category
**POST** `/categories`
```json
{
  "category_name": "Work"
}
```

### Update Category by Name
**PUT** `/categories/name/:name`
```json
{
  "category_name": "Updated Category Name"
}
```

### Delete Category by Name
**DELETE** `/categories/name/:name`
- Deletes category

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "count": 10
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error"
}
```

---

## Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error

---

## Admin Panel
- **URL**: Access via ⚙️ Admin button in dashboard
- **Password**: `admin123`
- **Features**:
  - View all agents
  - Create new agents
  - Edit agent information
  - Delete agents
