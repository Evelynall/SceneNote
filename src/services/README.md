# 服务层预留

`storage.ts` 已定义项目存储契约，并暂时适配 IndexedDB。未来加入 `supabase.ts` 时，只需实现同一契约；页面和 Pinia Store 无需改变，实现本地存储与云同步的可替换性。
