# Loading Indicators Improvement

## Problem
When users entered the application and selected a project, chats and documents would load without any visual indication. This created a poor user experience where:
- Users saw empty states before data loaded
- No feedback indicated that data was being fetched
- Users might think the app was broken or empty

## Solution Implemented

### 1. Added Loading State for Chats
**File:** `components/case-workspace.tsx`

- Added `isLoadingChats` prop to the `CaseWorkspaceProps` interface
- Passed `isLoadingChatsFromDB` state from `ChatPageClient` to `CaseWorkspace`
- Added visual loading indicators in multiple places:

#### a) Chats Sidebar Header
Shows a small spinning loader next to "Чаты проекта" title while loading:
```typescript
{isLoadingChats && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
```

#### b) Chats List Area
Shows a prominent loading state in the chats list with:
- Large spinning loader icon
- "Загрузка чатов..." message
- "Получаем историю разговоров" sub-message

#### c) Main Chat Area
When no active session exists and chats are loading, shows:
- Large spinning loader in the center
- "Загрузка чатов..." title
- "Получаем вашу историю разговоров" message

#### d) Header Status
Shows mini spinning loaders in the project header counts:
- Next to "чатов" count while chats are loading
- Next to "документов" count while documents are loading

### 2. Improved Loading State for Documents
**File:** `components/case-workspace.tsx`

Enhanced the documents loading indicator to be more prominent:
- Shows large centered spinner when documents are loading
- "Загрузка документов..." message
- "Получаем прикрепленные файлы" sub-message
- Previously only had a small header indicator

### 3. Disabled Input Controls During Loading
**File:** `components/case-workspace.tsx`

To prevent users from trying to interact while data loads:
- Disabled textarea input: `disabled={isLoading || isLoadingChats}`
- Disabled send button: `disabled={isLoading || isUploadingDocument || isLoadingChats || !input.trim()}`
- Send button shows "Загрузка..." text when chats are loading
- Send button shows spinning loader when loading

## Files Modified

1. **`components/case-workspace.tsx`**
   - Added `isLoadingChats` prop
   - Added loading indicators in chats sidebar
   - Added loading indicators in main chat area
   - Enhanced documents loading indicators
   - Added loading state in header counts
   - Disabled controls during loading

2. **`components/chat-page-client.tsx`**
   - Passed `isLoadingChatsFromDB` to `CaseWorkspace` component

## User Experience Improvements

✅ **Before:** Empty states appeared suddenly, no feedback during data loading
✅ **After:** Clear visual feedback at every step of the loading process

### Loading Flow:
1. User selects project
2. Header shows "🔄 документов · 🔄 чатов" with spinning indicators
3. Sidebar shows "Загрузка чатов..." or "Загрузка документов..." with spinner
4. Main area shows large centered loading state
5. Input controls are disabled with "Загрузка..." message
6. Once loaded, all indicators disappear and normal UI appears

## Technical Details

- Uses existing `isLoadingChatsFromDB` state that was already tracking chat loading
- Leverages existing `isDocumentsLoading` state for document loading
- Uses Lucide React's `Loader2` icon component for consistent spinner design
- All loading states are synchronized with actual API calls
- No additional API calls or state management needed

## Testing Recommendations

1. ✅ Select a project with existing chats and documents
2. ✅ Verify loading indicators appear in all locations
3. ✅ Confirm indicators disappear after data loads
4. ✅ Check that input controls are disabled during loading
5. ✅ Test with slow network to see loading states clearly
6. ✅ Verify empty states show correctly after loading completes

## Result

Users now have clear, professional feedback during all loading operations, preventing confusion and creating a more polished user experience. The loading states are consistent with modern UX best practices and match the existing design system.

