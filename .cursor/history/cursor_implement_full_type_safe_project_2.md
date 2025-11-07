# Implement full type-safe project structure
_Exported on 07/11/2025 at 15:10:15 CET from Cursor (1.7.46)_

---

**User**

Read the assigned task file (`.docs/T1.md`) and generate the full, type-safe implementation.

- Summarize the objective and deliverables.
- Implement backend, frontend, and data logic according to `.cursor/rules.md`.
- Maintain consistent naming, imports, and folder structure.
- Commit all changes in one coherent step.

---

**Cursor**

I'll start by reviewing any coding rules in the repository and then implement the data, types, backend API route, library functions, and a simple frontend feed page that consumes the API. After implementing, I'll run a linter check and commit everything in one atomic commit.

I'm going to add the mock dataset file with ~100 posts to `data/reddit-mock.json`. I'll then proceed to define types and implement the loader and API/frontend in subsequent steps.

```json
[
  {"id":"post-1","subreddit":"r/startups","title":"Struggling to find early users","body":"What channels worked best for your first 50 users?","upvotes":112,"num_comments":24,"created_utc":1730512345},
  {"id":"post-2","subreddit":"r/entrepreneur","title":"Should I bootstrap or raise?","body":"We have some revenue but growth is slow.","upvotes":85,"num_comments":31,"created_utc":1730512645},
  {"id":"post-3","subreddit":"r/marketing","title":"Content vs paid for B2B SaaS","body":"What mix worked for you?","upvotes":67,"num_comments":18,"created_utc":1730512945},
  {"id":"post-4","subreddit":"r/productivity","title":"Daily routine for indie hackers","body":"Share your best habits.","upvotes":143,"num_comments":40,"created_utc":1730513245},
  {"id":"post-5","subreddit":"r/webdev","title":"Next.js vs Remix in 2025","body":"Tradeoffs for data-heavy apps?","upvotes":91,"num_comments":27,"created_utc":1730513545},
  {"id":"post-6","subreddit":"r/startups","title":"How to do customer discovery calls","body":"Looking for a structure that works.","upvotes":102,"num_comments":22,"created_utc":1730513845},
  {"id":"post-7","subreddit":"r/entrepreneur","title":"Hiring first engineer tips","body":"What should I screen for?","upvotes":76,"num_comments":29,"created_utc":1730514145},
  {"id":"post-8","subreddit":"r/marketing","title":"SEO in 2025 still worth it?","body":"Given AI summaries, is SEO dead?","upvotes":58,"num_comments":19,"created_utc":1730514445},
  {"id":"post-9","subreddit":"r/productivity","title":"Time blocking vs pomodoro","body":"Which one helped you more?","upvotes":132,"num_comments":33,"created_utc":1730514745},
  {"id":"post-10","subreddit":"r/webdev","title":"Best component libraries for Next.js","body":"Looking for accessible options.","upvotes":97,"num_comments":21,"created_utc":1730515045},
  {"id":"post-11","subreddit":"r/startups","title":"Pricing page conversion tips","body":"Above the fold essentials?","upvotes":119,"num_comments":25,"created_utc":1730515345},
  {"id":"post-12","subreddit":"r/entrepreneur","title":"LLC vs C-Corp for SaaS","body":"We plan to hire next year.","upvotes":64,"num_comments":17,"created_utc":1730515645},
  {"id":"post-13","subreddit":"r/marketing","title":"Email sequences that actually work","body":"Share frameworks and examples.","upvotes":73,"num_comments":20,"created_utc":1730515945},
  {"id":"post-14","subreddit":"r/productivity","title":"Beating procrastination on deep work","body":"How do you stay focused?","upvotes":125,"num_comments":34,"created_utc":1730516245},
  {"id":"post-15","subreddit":"r/webdev","title":"Edge vs serverless functions","body":"Latency and cold starts experiences.","upvotes":88,"num_comments":23,"created_utc":1730516545},
  {"id":"post-16","subreddit":"r/startups","title":"Finding a technical cofounder","body":"Where to meet serious partners?","upvotes":110,"num_comments":28,"created_utc":1730516845},
  {"id":"post-17","subreddit":"r/entrepreneur","title":"First sales hire playbook","body":"What targets are reasonable?","upvotes":69,"num_comments":16,"created_utc":1730517145},
  {"id":"post-18","subreddit":"r/marketing","title":"TikTok for B2B—any wins?","body":"Looking for real case studies.","upvotes":55,"num_comments":14,"created_utc":1730517445},
  {"id":"post-19","subreddit":"r/productivity","title":"Morning vs night coding","body":"When are you most effective?","upvotes":134,"num_comments":37,"created_utc":1730517745},
  {"id":"post-20","subreddit":"r/webdev","title":"Type-safe APIs in Next.js","body":"Best patterns for contracts.","upvotes":101,"num_comments":26,"created_utc":1730518045},
  {"id":"post-21","subreddit":"r/startups","title":"Validating before building","body":"How much validation is enough?","upvotes":117,"num_comments":23,"created_utc":1730518345},
  {"id":"post-22","subreddit":"r/entrepreneur","title":"Cold email deliverability tips","body":"Avoiding spam folder in 2025.","upvotes":72,"num_comments":19,"created_utc":1730518645},
  {"id":"post-23","subreddit":"r/marketing","title":"Community-led growth mechanics","body":"How to start one from scratch?","upvotes":61,"num_comments":18,"created_utc":1730518945},
  {"id":"post-24","subreddit":"r/productivity","title":"Best note-taking apps now","body":"Obsidian vs Notion debate.","upvotes":129,"num_comments":32,"created_utc":1730519245},
  {"id":"post-25","subreddit":"r/webdev","title":"App Router patterns","body":"Sharing server components wisely.","upvotes":92,"num_comments":24,"created_utc":1730519545},
  {"id":"post-26","subreddit":"r/startups","title":"Landing page critiques","body":"Roast mine gently please.","upvotes":113,"num_comments":30,"created_utc":1730519845},
  {"id":"post-27","subreddit":"r/entrepreneur","title":"Freemium to paid conversion","body":"What limits worked best?","upvotes":78,"num_comments":22,"created_utc":1730520145},
  {"id":"post-28","subreddit":"r/marketing","title":"Brand vs performance budget","body":"What split do you use?","upvotes":66,"num_comments":15,"created_utc":1730520445},
  {"id":"post-29","subreddit":"r/productivity","title":"Context switching tax","body":"How do you minimize it?","upvotes":131,"num_comments":35,"created_utc":1730520745},
  {"id":"post-30","subreddit":"r/webdev","title":"Server Actions in prod","body":"Security considerations?","upvotes":95,"num_comments":20,"created_utc":1730521045},
  {"id":"post-31","subreddit":"r/startups","title":"When to pivot","body":"Any heuristics to decide?","upvotes":115,"num_comments":27,"created_utc":1730521345},
  {"id":"post-32","subreddit":"r/entrepreneur","title":"International pricing strategy","body":"How to localize fairly?","upvotes":70,"num_comments":21,"created_utc":1730521645},
  {"id":"post-33","subreddit":"r/marketing","title":"Referral programs that work","body":"Examples welcome.","upvotes":62,"num_comments":17,"created_utc":1730521945},
  {"id":"post-34","subreddit":"r/productivity","title":"Weekly review checklist","body":"What do you include?","upvotes":127,"num_comments":31,"created_utc":1730522245},
  {"id":"post-35","subreddit":"r/webdev","title":"React Server Components pitfalls","body":"What should we avoid?","upvotes": ninety,"num_comments":26,"created_utc":1730522545},
  {"id":"post-36","subreddit":"r/startups","title":"Pre-seed deck essentials","body":"What slides matter?","upvotes":111,"num_comments":28,"created_utc":1730522845},
  {"id":"post-37","subreddit":"r/entrepreneur","title":"Firing fast but fair","body":"How to handle performance issues?","upvotes":74,"num_comments":20,"created_utc":1730523145},
  {"id":"post-38","subreddit":"r/marketing","title":"Positioning exercises","body":"Favorite frameworks?","upvotes":60,"num_comments":14,"created_utc":1730523445},
  {"id":"post-39","subreddit":"r/productivity","title":"Keyboard only workflows","body":"Shortcuts you love.","upvotes":133,"num_comments":36,"created_utc":1730523745},
  {"id":"post-40","subreddit":"r/webdev","title":"Auth patterns in Next.js","body":"Magic links vs OAuth.","upvotes":98,"num_comments":23,"created_utc":1730524045},
  {"id":"post-41","subreddit":"r/startups","title":"Onboarding flow improvements","body":"Where to add friction?","upvotes":118,"num_comments":26,"created_utc":1730524345},
  {"id":"post-42","subreddit":"r/entrepreneur","title":"First PM hire","body":"What scope is realistic?","upvotes":71,"num_comments":19,"created_utc":1730524645},
  {"id":"post-43","subreddit":"r/marketing","title":"Podcast ads ROI","body":"Any updated data?","upvotes":63,"num_comments":16,"created_utc":1730524945},
  {"id":"post-44","subreddit":"r/productivity","title":"Meeting minimization tactics","body":"Async standups yay or nay?","upvotes":130,"num_comments":33,"created_utc":1730525245},
  {"id":"post-45","subreddit":"r/webdev","title":"Monorepo or polyrepo","body":"What did you choose and why?","upvotes":93,"num_comments":22,"created_utc":1730525545},
  {"id":"post-46","subreddit":"r/startups","title":"ICP clarity exercises","body":"How to narrow down?","upvotes":116,"num_comments":24,"created_utc":1730525845},
  {"id":"post-47","subreddit":"r/entrepreneur","title":"CAC payback expectations","body":"For SMB SaaS?","upvotes":77,"num_comments":18,"created_utc":1730526145},
  {"id":"post-48","subreddit":"r/marketing","title":"Winning landing page hero","body":"What makes it pop?","upvotes":65,"num_comments":15,"created_utc":1730526445},
  {"id":"post-49","subreddit":"r/productivity","title":"Single-tasking week","body":"Anyone tried it?","upvotes":128,"num_comments":34,"created_utc":1730526745},
  {"id":"post-50","subreddit":"r/webdev","title":"Turbopack status","body":"Is it ready for prime time?","upvotes":96,"num_comments":21,"created_utc":1730527045},
  {"id":"post-51","subreddit":"r/startups","title":"Finding design partners","body":"Where to start?","upvotes":114,"num_comments":23,"created_utc":1730527345},
  {"id":"post-52","subreddit":"r/entrepreneur","title":"Equity splits among cofounders","body":"Avoiding future conflicts.","upvotes":73,"num_comments":17,"created_utc":1730527645},
  {"id":"post-53","subreddit":"r/marketing","title":"Event marketing worth it?","body":"For early-stage?","upvotes":59,"num_comments":14,"created_utc":1730527945},
  {"id":"post-54","subreddit":"r/productivity","title":"Energy management, not time","body":"What changed your day?","upvotes":126,"num_comments":32,"created_utc":1730528245},
  {"id":"post-55","subreddit":"r/webdev","title":"Serverless cost surprises","body":"What to watch for?","upvotes":94,"num_comments":20,"created_utc":1730528545},
  {"id":"post-56","subreddit":"r/startups","title":"Nailing problem statements","body":"Templates that help.","upvotes":112,"num_comments":25,"created_utc":1730528845},
  {"id":"post-57","subreddit":"r/entrepreneur","title":"When to quit the day job","body":"Signals you looked for.","upvotes":75,"num_comments":19,"created_utc":1730529145},
  {"id":"post-58","subreddit":"r/marketing","title":"UGC for SaaS","body":"Any frameworks?","upvotes":57,"num_comments":13,"created_utc":1730529445},
  {"id":"post-59","subreddit":"r/productivity","title":"Best weekly planners","body":"Paper or digital?","upvotes":135,"num_comments":38,"created_utc":1730529745},
  {"id":"post-60","subreddit":"r/webdev","title":"API design guidelines","body":"REST vs RPC vs GraphQL.","upvotes":99,"num_comments":24,"created_utc":1730530045},
  {"id":"post-61","subreddit":"r/startups","title":"Choosing a niche","body":"How small is too small?","upvotes":120,"num_comments":26,"created_utc":1730530345},
  {"id":"post-62","subreddit":"r/entrepreneur","title":"Negotiating vendor pricing","body":"Tactics that work.","upvotes":80,"num_comments":21,"created_utc":1730530645},
  {"id":"post-63","subreddit":"r/marketing","title":"PR for small teams","body":"Worth the effort?","upvotes":68,"num_comments":18,"created_utc":1730530945},
  {"id":"post-64","subreddit":"r/productivity","title":"Email zero strategies","body":"Do you archive or delete?","upvotes":124,"num_comments":30,"created_utc":1730531245},
  {"id":"post-65","subreddit":"r/webdev","title":"SWR vs React Query","body":"Which one and why?","upvotes": ninety,"num_comments":22,"created_utc":1730531545},
  {"id":"post-66","subreddit":"r/startups","title":"Cold outreach scripts","body":"Sharing templates.","upvotes":109,"num_comments":24,"created_utc":1730531845},
  {"id":"post-67","subreddit":"r/entrepreneur","title":"SaaS metrics to track","body":"Beyond MRR and churn.","upvotes":79,"num_comments":20,"created_utc":1730532145},
  {"id":"post-68","subreddit":"r/marketing","title":"Landing page heatmaps","body":"What tools are best?","upvotes":56,"num_comments":12,"created_utc":1730532445},
  {"id":"post-69","subreddit":"r/productivity","title":"Deep work environments","body":"Home vs office vs cafe?","upvotes":136,"num_comments":39,"created_utc":1730532745},
  {"id":"post-70","subreddit":"r/webdev","title":"Caching strategies in Next.js","body":"CDN vs ISR vs runtime.","upvotes":100,"num_comments":23,"created_utc":1730533045},
  {"id":"post-71","subreddit":"r/startups","title":"Low-touch onboarding","body":"Reducing support tickets.","upvotes":121,"num_comments":27,"created_utc":1730533345},
  {"id":"post-72","subreddit":"r/entrepreneur","title":"Salaries in early startups","body":"How do you decide?","upvotes":81,"num_comments":22,"created_utc":1730533645},
  {"id":"post-73","subreddit":"r/marketing","title":"Attribution is broken","body":"How do you handle it?","upvotes":69,"num_comments":19,"created_utc":1730533945},
  {"id":"post-74","subreddit":"r/productivity","title":"Focus music playlists","body":"Drop your favorites.","upvotes":123,"num_comments":31,"created_utc":1730534245},
  {"id":"post-75","subreddit":"r/webdev","title":"Error handling patterns","body":"User-friendly yet safe.","upvotes":97,"num_comments":21,"created_utc":1730534545},
  {"id":"post-76","subreddit":"r/startups","title":"Landing page above the fold","body":"What to include?","upvotes":118,"num_comments":25,"created_utc":1730534845},
  {"id":"post-77","subreddit":"r/entrepreneur","title":"Sales-led vs product-led","body":"Which path did you take?","upvotes":82,"num_comments":23,"created_utc":1730535145},
  {"id":"post-78","subreddit":"r/marketing","title":"Lifecycle emails that convert","body":"Share examples.","upvotes":67,"num_comments":16,"created_utc":1730535445},
  {"id":"post-79","subreddit":"r/productivity","title":"Task management setups","body":"Kanban vs GTD?","upvotes":132,"num_comments":35,"created_utc":1730535745},
  {"id":"post-80","subreddit":"r/webdev","title":"Streaming SSR tips","body":"When to use it?","upvotes":99,"num_comments":24,"created_utc":1730536045},
  {"id":"post-81","subreddit":"r/startups","title":"Cold email personalization","body":"At scale, how?","upvotes":116,"num_comments":26,"created_utc":1730536345},
  {"id":"post-82","subreddit":"r/entrepreneur","title":"Equity for advisors","body":"What norms have you seen?","upvotes":83,"num_comments":22,"created_utc":1730536645},
  {"id":"post-83","subreddit":"r/marketing","title":"Landing page copy formulas","body":"What hooks work?","upvotes":70,"num_comments":18,"created_utc":1730536945},
  {"id":"post-84","subreddit":"r/productivity","title":"Saying no politely","body":"How to protect your time?","upvotes":125,"num_comments":33,"created_utc":1730537245},
  {"id":"post-85","subreddit":"r/webdev","title":"File uploads in Next.js","body":"Edge-compatible patterns.","upvotes":96,"num_comments":22,"created_utc":1730537545},
  {"id":"post-86","subreddit":"r/startups","title":"Building in public","body":"Pros and cons?","upvotes":119,"num_comments":28,"created_utc":1730537845},
  {"id":"post-87","subreddit":"r/entrepreneur","title":"Contractor vs employee","body":"For first hires.","upvotes":78,"num_comments":20,"created_utc":1730538145},
  {"id":"post-88","subreddit":"r/marketing","title":"Ad creative testing pace","body":"How fast do you iterate?","upvotes":64,"num_comments":15,"created_utc":1730538445},
  {"id":"post-89","subreddit":"r/productivity","title":"Friction logs","body":"Do you keep them?","upvotes":131,"num_comments":34,"created_utc":1730538745},
  {"id":"post-90","subreddit":"r/webdev","title":"Image optimization in App Router","body":"What’s best now?","upvotes":101,"num_comments":23,"created_utc":1730539045},
  {"id":"post-91","subreddit":"r/startups","title":"Beta program setups","body":"Invites and feedback loops.","upvotes":122,"num_comments":27,"created_utc":1730539345},
  {"id":"post-92","subreddit":"r/entrepreneur","title":"Legal must-haves","body":"Privacy, terms, DPA?","upvotes":84,"num_comments":21,"created_utc":1730539645},
  {"id":"post-93","subreddit":"r/marketing","title":"Quora in 2025","body":"Still useful?","upvotes":71,"num_comments":18,"created_utc":1730539945},
  {"id":"post-94","subreddit":"r/productivity","title":"Burnout prevention","body":"How do you refill?","upvotes":129,"num_comments":32,"created_utc":1730540245},
  {"id":"post-95","subreddit":"r/webdev","title":"Type-safe env management","body":"Runtime validation tips.","upvotes":98,"num_comments":24,"created_utc":1730540545},
  {"id":"post-96","subreddit":"r/startups","title":"Churn reduction ideas","body":"Onboarding and activation.","upvotes":121,"num_comments":29,"created_utc":1730540845},
  {"id":"post-97","subreddit":"r/entrepreneur","title":"Setting OKRs that stick","body":"Team of five.","upvotes":82,"num_comments":22,"created_utc":1730541145},
  {"id":"post-98","subreddit":"r/marketing","title":"Cold DM frameworks","body":"LinkedIn specific.","upvotes":69,"num_comments":17,"created_utc":1730541445},
  {"id":"post-99","subreddit":"r/productivity","title":"Work sprints","body":"How long is ideal?","upvotes":133,"num_comments":36,"created_utc":1730541745},
  {"id":"post-100","subreddit":"r/webdev","title":"Node 22 features you use","body":"What improved DX?","upvotes":102,"num_comments":25,"created_utc":1730542045}
]

```

```json
[
  {"id":"post-1","subreddit":"r/startups","title":"Struggling to find early users","body":"What channels worked best for your first 50 users?","upvotes":112,"num_comments":24,"created_utc":1730512345},
  {"id":"post-2","subreddit":"r/entrepreneur","title":"Should I bootstrap or raise?","body":"We have some revenue but growth is slow.","upvotes":85,"num_comments":31,"created_utc":1730512645},
  {"id":"post-3","subreddit":"r/marketing","title":"Content vs paid for B2B SaaS","body":"What mix worked for you?","upvotes":67,"num_comments":18,"created_utc":1730512945},
  {"id":"post-4","subreddit":"r/productivity","title":"Daily routine for indie hackers","body":"Share your best habits.","upvotes":143,"num_comments":40,"created_utc":1730513245},
  {"id":"post-5","subreddit":"r/webdev","title":"Next.js vs Remix in 2025","body":"Tradeoffs for data-heavy apps?","upvotes":91,"num_comments":27,"created_utc":1730513545},
  {"id":"post-6","subreddit":"r/startups","title":"How to do customer discovery calls","body":"Looking for a structure that works.","upvotes":102,"num_comments":22,"created_utc":1730513845},
  {"id":"post-7","subreddit":"r/entrepreneur","title":"Hiring first engineer tips","body":"What should I screen for?","upvotes":76,"num_comments":29,"created_utc":1730514145},
  {"id":"post-8","subreddit":"r/marketing","title":"SEO in 2025 still worth it?","body":"Given AI summaries, is SEO dead?","upvotes":58,"num_comments":19,"created_utc":1730514445},
  {"id":"post-9","subreddit":"r/productivity","title":"Time blocking vs pomodoro","body":"Which one helped you more?","upvotes":132,"num_comments":33,"created_utc":1730514745},
  {"id":"post-10","subreddit":"r/webdev","title":"Best component libraries for Next.js","body":"Looking for accessible options.","upvotes":97,"num_comments":21,"created_utc":1730515045},
  {"id":"post-11","subreddit":"r/startups","title":"Pricing page conversion tips","body":"Above the fold essentials?","upvotes":119,"num_comments":25,"created_utc":1730515345},
  {"id":"post-12","subreddit":"r/entrepreneur","title":"LLC vs C-Corp for SaaS","body":"We plan to hire next year.","upvotes":64,"num_comments":17,"created_utc":1730515645},
  {"id":"post-13","subreddit":"r/marketing","title":"Email sequences that actually work","body":"Share frameworks and examples.","upvotes":73,"num_comments":20,"created_utc":1730515945},
  {"id":"post-14","subreddit":"r/productivity","title":"Beating procrastination on deep work","body":"How do you stay focused?","upvotes":125,"num_comments":34,"created_utc":1730516245},
  {"id":"post-15","subreddit":"r/webdev","title":"Edge vs serverless functions","body":"Latency and cold starts experiences.","upvotes":88,"num_comments":23,"created_utc":1730516545},
  {"id":"post-16","subreddit":"r/startups","title":"Finding a technical cofounder","body":"Where to meet serious partners?","upvotes":110,"num_comments":28,"created_utc":1730516845},
  {"id":"post-17","subreddit":"r/entrepreneur","title":"First sales hire playbook","body":"What targets are reasonable?","upvotes":69,"num_comments":16,"created_utc":1730517145},
  {"id":"post-18","subreddit":"r/marketing","title":"TikTok for B2B—any wins?","body":"Looking for real case studies.","upvotes":55,"num_comments":14,"created_utc":1730517445},
  {"id":"post-19","subreddit":"r/productivity","title":"Morning vs night coding","body":"When are you most effective?","upvotes":134,"num_comments":37,"created_utc":1730517745},
  {"id":"post-20","subreddit":"r/webdev","title":"Type-safe APIs in Next.js","body":"Best patterns for contracts.","upvotes":101,"num_comments":26,"created_utc":1730518045},
  {"id":"post-21","subreddit":"r/startups","title":"Validating before building","body":"How much validation is enough?","upvotes":117,"num_comments":23,"created_utc":1730518345},
  {"id":"post-22","subreddit":"r/entrepreneur","title":"Cold email deliverability tips","body":"Avoiding spam folder in 2025.","upvotes":72,"num_comments":19,"created_utc":1730518645},
  {"id":"post-23","subreddit":"r/marketing","title":"Community-led growth mechanics","body":"How to start one from scratch?","upvotes":61,"num_comments":18,"created_utc":1730518945},
  {"id":"post-24","subreddit":"r/productivity","title":"Best note-taking apps now","body":"Obsidian vs Notion debate.","upvotes":129,"num_comments":32,"created_utc":1730519245},
  {"id":"post-25","subreddit":"r/webdev","title":"App Router patterns","body":"Sharing server components wisely.","upvotes":92,"num_comments":24,"created_utc":1730519545},
  {"id":"post-26","subreddit":"r/startups","title":"Landing page critiques","body":"Roast mine gently please.","upvotes":113,"num_comments":30,"created_utc":1730519845},
  {"id":"post-27","subreddit":"r/entrepreneur","title":"Freemium to paid conversion","body":"What limits worked best?","upvotes":78,"num_comments":22,"created_utc":1730520145},
  {"id":"post-28","subreddit":"r/marketing","title":"Brand vs performance budget","body":"What split do you use?","upvotes":66,"num_comments":15,"created_utc":1730520445},
  {"id":"post-29","subreddit":"r/productivity","title":"Context switching tax","body":"How do you minimize it?","upvotes":131,"num_comments":35,"created_utc":1730520745},
  {"id":"post-30","subreddit":"r/webdev","title":"Server Actions in prod","body":"Security considerations?","upvotes":95,"num_comments":20,"created_utc":1730521045},
  {"id":"post-31","subreddit":"r/startups","title":"When to pivot","body":"Any heuristics to decide?","upvotes":115,"num_comments":27,"created_utc":1730521345},
  {"id":"post-32","subreddit":"r/entrepreneur","title":"International pricing strategy","body":"How to localize fairly?","upvotes":70,"num_comments":21,"created_utc":1730521645},
  {"id":"post-33","subreddit":"r/marketing","title":"Referral programs that work","body":"Examples welcome.","upvotes":62,"num_comments":17,"created_utc":1730521945},
  {"id":"post-34","subreddit":"r/productivity","title":"Weekly review checklist","body":"What do you include?","upvotes":127,"num_comments":31,"created_utc":1730522245},
  {"id":"post-35","subreddit":"r/webdev","title":"React Server Components pitfalls","body":"What should we avoid?","upvotes":90,"num_comments":26,"created_utc":1730522545},
  {"id":"post-36","subreddit":"r/startups","title":"Pre-seed deck essentials","body":"What slides matter?","upvotes":111,"num_comments":28,"created_utc":1730522845},
  {"id":"post-37","subreddit":"r/entrepreneur","title":"Firing fast but fair","body":"How to handle performance issues?","upvotes":74,"num_comments":20,"created_utc":1730523145},
  {"id":"post-38","subreddit":"r/marketing","title":"Positioning exercises","body":"Favorite frameworks?","upvotes":60,"num_comments":14,"created_utc":1730523445},
  {"id":"post-39","subreddit":"r/productivity","title":"Keyboard only workflows","body":"Shortcuts you love.","upvotes":133,"num_comments":36,"created_utc":1730523745},
  {"id":"post-40","subreddit":"r/webdev","title":"Auth patterns in Next.js","body":"Magic links vs OAuth.","upvotes":98,"num_comments":23,"created_utc":1730524045},
  {"id":"post-41","subreddit":"r/startups","title":"Onboarding flow improvements","body":"Where to add friction?","upvotes":118,"num_comments":26,"created_utc":1730524345},
  {"id":"post-42","subreddit":"r/entrepreneur","title":"First PM hire","body":"What scope is realistic?","upvotes":71,"num_comments":19,"created_utc":1730524645},
  {"id":"post-43","subreddit":"r/marketing","title":"Podcast ads ROI","body":"Any updated data?","upvotes":63,"num_comments":16,"created_utc":1730524945},
  {"id":"post-44","subreddit":"r/productivity","title":"Meeting minimization tactics","body":"Async standups yay or nay?","upvotes":130,"num_comments":33,"created_utc":1730525245},
  {"id":"post-45","subreddit":"r/webdev","title":"Monorepo or polyrepo","body":"What did you choose and why?","upvotes":93,"num_comments":22,"created_utc":1730525545},
  {"id":"post-46","subreddit":"r/startups","title":"ICP clarity exercises","body":"How to narrow down?","upvotes":116,"num_comments":24,"created_utc":1730525845},
  {"id":"post-47","subreddit":"r/entrepreneur","title":"CAC payback expectations","body":"For SMB SaaS?","upvotes":77,"num_comments":18,"created_utc":1730526145},
  {"id":"post-48","subreddit":"r/marketing","title":"Winning landing page hero","body":"What makes it pop?","upvotes":65,"num_comments":15,"created_utc":1730526445},
  {"id":"post-49","subreddit":"r/productivity","title":"Single-tasking week","body":"Anyone tried it?","upvotes":128,"num_comments":34,"created_utc":1730526745},
  {"id":"post-50","subreddit":"r/webdev","title":"Turbopack status","body":"Is it ready for prime time?","upvotes":96,"num_comments":21,"created_utc":1730527045},
  {"id":"post-51","subreddit":"r/startups","title":"Finding design partners","body":"Where to start?","upvotes":114,"num_comments":23,"created_utc":1730527345},
  {"id":"post-52","subreddit":"r/entrepreneur","title":"Equity splits among cofounders","body":"Avoiding future conflicts.","upvotes":73,"num_comments":17,"created_utc":1730527645},
  {"id":"post-53","subreddit":"r/marketing","title":"Event marketing worth it?","body":"For early-stage?","upvotes":59,"num_comments":14,"created_utc":1730527945},
  {"id":"post-54","subreddit":"r/productivity","title":"Energy management, not time","body":"What changed your day?","upvotes":126,"num_comments":32,"created_utc":1730528245},
  {"id":"post-55","subreddit":"r/webdev","title":"Serverless cost surprises","body":"What to watch for?","upvotes":94,"num_comments":20,"created_utc":1730528545},
  {"id":"post-56","subreddit":"r/startups","title":"Nailing problem statements","body":"Templates that help.","upvotes":112,"num_comments":25,"created_utc":1730528845},
  {"id":"post-57","subreddit":"r/entrepreneur","title":"When to quit the day job","body":"Signals you looked for.","upvotes":75,"num_comments":19,"created_utc":1730529145},
  {"id":"post-58","subreddit":"r/marketing","title":"UGC for SaaS","body":"Any frameworks?","upvotes":57,"num_comments":13,"created_utc":1730529445},
  {"id":"post-59","subreddit":"r/productivity","title":"Best weekly planners","body":"Paper or digital?","upvotes":135,"num_comments":38,"created_utc":1730529745},
  {"id":"post-60","subreddit":"r/webdev","title":"API design guidelines","body":"REST vs RPC vs GraphQL.","upvotes":99,"num_comments":24,"created_utc":1730530045},
  {"id":"post-61","subreddit":"r/startups","title":"Choosing a niche","body":"How small is too small?","upvotes":120,"num_comments":26,"created_utc":1730530345},
  {"id":"post-62","subreddit":"r/entrepreneur","title":"Negotiating vendor pricing","body":"Tactics that work.","upvotes":80,"num_comments":21,"created_utc":1730530645},
  {"id":"post-63","subreddit":"r/marketing","title":"PR for small teams","body":"Worth the effort?","upvotes":68,"num_comments":18,"created_utc":1730530945},
  {"id":"post-64","subreddit":"r/productivity","title":"Email zero strategies","body":"Do you archive or delete?","upvotes":124,"num_comments":30,"created_utc":1730531245},
  {"id":"post-65","subreddit":"r/webdev","title":"SWR vs React Query","body":"Which one and why?","upvotes":90,"num_comments":22,"created_utc":1730531545},
  {"id":"post-66","subreddit":"r/startups","title":"Cold outreach scripts","body":"Sharing templates.","upvotes":109,"num_comments":24,"created_utc":1730531845},
  {"id":"post-67","subreddit":"r/entrepreneur","title":"SaaS metrics to track","body":"Beyond MRR and churn.","upvotes":79,"num_comments":20,"created_utc":1730532145},
  {"id":"post-68","subreddit":"r/marketing","title":"Landing page heatmaps","body":"What tools are best?","upvotes":56,"num_comments":12,"created_utc":1730532445},
  {"id":"post-69","subreddit":"r/productivity","title":"Deep work environments","body":"Home vs office vs cafe?","upvotes":136,"num_comments":39,"created_utc":1730532745},
  {"id":"post-70","subreddit":"r/webdev","title":"Caching strategies in Next.js","body":"CDN vs ISR vs runtime.","upvotes":100,"num_comments":23,"created_utc":1730533045},
  {"id":"post-71","subreddit":"r/startups","title":"Low-touch onboarding","body":"Reducing support tickets.","upvotes":121,"num_comments":27,"created_utc":1730533345},
  {"id":"post-72","subreddit":"r/entrepreneur","title":"Salaries in early startups","body":"How do you decide?","upvotes":81,"num_comments":22,"created_utc":1730533645},
  {"id":"post-73","subreddit":"r/marketing","title":"Attribution is broken","body":"How do you handle it?","upvotes":69,"num_comments":19,"created_utc":1730533945},
  {"id":"post-74","subreddit":"r/productivity","title":"Focus music playlists","body":"Drop your favorites.","upvotes":123,"num_comments":31,"created_utc":1730534245},
  {"id":"post-75","subreddit":"r/webdev","title":"Error handling patterns","body":"User-friendly yet safe.","upvotes":97,"num_comments":21,"created_utc":1730534545},
  {"id":"post-76","subreddit":"r/startups","title":"Landing page above the fold","body":"What to include?","upvotes":118,"num_comments":25,"created_utc":1730534845},
  {"id":"post-77","subreddit":"r/entrepreneur","title":"Sales-led vs product-led","body":"Which path did you take?","upvotes":82,"num_comments":23,"created_utc":1730535145},
  {"id":"post-78","subreddit":"r/marketing","title":"Lifecycle emails that convert","body":"Share examples.","upvotes":67,"num_comments":16,"created_utc":1730535445},
  {"id":"post-79","subreddit":"r/productivity","title":"Task management setups","body":"Kanban vs GTD?","upvotes":132,"num_comments":35,"created_utc":1730535745},
  {"id":"post-80","subreddit":"r/webdev","title":"Streaming SSR tips","body":"When to use it?","upvotes":99,"num_comments":24,"created_utc":1730536045},
  {"id":"post-81","subreddit":"r/startups","title":"Cold email personalization","body":"At scale, how?","upvotes":116,"num_comments":26,"created_utc":1730536345},
  {"id":"post-82","subreddit":"r/entrepreneur","title":"Equity for advisors","body":"What norms have you seen?","upvotes":83,"num_comments":22,"created_utc":1730536645},
  {"id":"post-83","subreddit":"r/marketing","title":"Landing page copy formulas","body":"What hooks work?","upvotes":70,"num_comments":18,"created_utc":1730536945},
  {"id":"post-84","subreddit":"r/productivity","title":"Saying no politely","body":"How to protect your time?","upvotes":125,"num_comments":33,"created_utc":1730537245},
  {"id":"post-85","subreddit":"r/webdev","title":"File uploads in Next.js","body":"Edge-compatible patterns.","upvotes":96,"num_comments":22,"created_utc":1730537545},
  {"id":"post-86","subreddit":"r/startups","title":"Building in public","body":"Pros and cons?","upvotes":119,"num_comments":28,"created_utc":1730537845},
  {"id":"post-87","subreddit":"r/entrepreneur","title":"Contractor vs employee","body":"For first hires.","upvotes":78,"num_comments":20,"created_utc":1730538145},
  {"id":"post-88","subreddit":"r/marketing","title":"Ad creative testing pace","body":"How fast do you iterate?","upvotes":64,"num_comments":15,"created_utc":1730538445},
  {"id":"post-89","subreddit":"r/productivity","title":"Friction logs","body":"Do you keep them?","upvotes":131,"num_comments":34,"created_utc":1730538745},
  {"id":"post-90","subreddit":"r/webdev","title":"Image optimization in App Router","body":"What’s best now?","upvotes":101,"num_comments":23,"created_utc":1730539045},
  {"id":"post-91","subreddit":"r/startups","title":"Beta program setups","body":"Invites and feedback loops.","upvotes":122,"num_comments":27,"created_utc":1730539345},
  {"id":"post-92","subreddit":"r/entrepreneur","title":"Legal must-haves","body":"Privacy, terms, DPA?","upvotes":84,"num_comments":21,"created_utc":1730539645},
  {"id":"post-93","subreddit":"r/marketing","title":"Quora in 2025","body":"Still useful?","upvotes":71,"num_comments":18,"created_utc":1730539945},
  {"id":"post-94","subreddit":"r/productivity","title":"Burnout prevention","body":"How do you refill?","upvotes":129,"num_comments":32,"created_utc":1730540245},
  {"id":"post-95","subreddit":"r/webdev","title":"Type-safe env management","body":"Runtime validation tips.","upvotes":98,"num_comments":24,"created_utc":1730540545},
  {"id":"post-96","subreddit":"r/startups","title":"Churn reduction ideas","body":"Onboarding and activation.","upvotes":121,"num_comments":29,"created_utc":1730540845},
  {"id":"post-97","subreddit":"r/entrepreneur","title":"Setting OKRs that stick","body":"Team of five.","upvotes":82,"num_comments":22,"created_utc":1730541145},
  {"id":"post-98","subreddit":"r/marketing","title":"Cold DM frameworks","body":"LinkedIn specific.","upvotes":69,"num_comments":17,"created_utc":1730541445},
  {"id":"post-99","subreddit":"r/productivity","title":"Work sprints","body":"How long is ideal?","upvotes":133,"num_comments":36,"created_utc":1730541745},
  {"id":"post-100","subreddit":"r/webdev","title":"Node 22 features you use","body":"What improved DX?","upvotes":102,"num_comments":25,"created_utc":1730542045}
]


```

```typescript
export interface RedditPost {
  id: string;
  subreddit: string;
  title: string;
  body: string;
  upvotes: number;
  num_comments: number;
  created_utc: number;
}


```

```typescript
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RedditPost } from '@/types/reddit';

const DATA_FILE_RELATIVE_PATH = path.join('data', 'reddit-mock.json');

export async function loadRedditPosts(): Promise<RedditPost[]> {
  const dataFilePath = path.join(process.cwd(), DATA_FILE_RELATIVE_PATH);
  const fileBuffer = await fs.readFile(dataFilePath, 'utf-8');
  const parsed = JSON.parse(fileBuffer) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error('Invalid reddit data format: expected an array');
  }

  // Lightweight runtime validation for required fields
  const posts: RedditPost[] = [];
  for (const item of parsed) {
    const candidate = item as Partial<RedditPost>;
    if (
      typeof candidate?.id === 'string' &&
      typeof candidate?.subreddit === 'string' &&
      typeof candidate?.title === 'string' &&
      typeof candidate?.body === 'string' &&
      typeof candidate?.upvotes === 'number' &&
      typeof candidate?.num_comments === 'number' &&
      typeof candidate?.created_utc === 'number'
    ) {
      posts.push(candidate as RedditPost);
    }
  }

  return posts;
}

export function pickRandomPosts(posts: RedditPost[], count: number): RedditPost[] {
  if (count <= 0) return [];
  if (count >= posts.length) return [...posts];

  // Fisher-Yates shuffle (partial) to sample without full shuffle cost
  const cloned = [...posts];
  const max = Math.min(count, cloned.length);
  for (let i = 0; i < max; i += 1) {
    const j = i + Math.floor(Math.random() * (cloned.length - i));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned.slice(0, max);
}


```

```typescript
import { NextResponse } from 'next/server';
import { loadRedditPosts, pickRandomPosts } from '@/lib/reddit-source';

export const dynamic = 'force-static';

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const countParam = url.searchParams.get('count');
  const count = countParam ? Math.max(1, Math.min(100, Number(countParam))) : 20;

  const allPosts = await loadRedditPosts();
  const posts = pickRandomPosts(allPosts, count);

  return NextResponse.json(
    { posts },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    }
  );
}


```

```typescriptreact
import type { RedditPost } from '@/types/reddit';

async function fetchPosts(count: number): Promise<RedditPost[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/reddit?count=${count}`, {
    // Ensure fresh data on navigation; still cacheable at the edge per API route
    next: { revalidate: 300 }
  });
  if (!res.ok) {
    throw new Error('Failed to load posts');
  }
  const data = (await res.json()) as { posts: RedditPost[] };
  return data.posts;
}

export default async function FeedPage() {
  const posts = await fetchPosts(20);
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Feed</h1>
      <ul style={{ display: 'grid', gap: 12, listStyle: 'none', padding: 0 }}>
        {posts.map((p) => (
          <li
            key={p.id}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 16,
              background: '#fff'
            }}
          >
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{p.subreddit}</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>{p.title}</div>
            <div style={{ fontSize: 14, color: '#374151', marginBottom: 10 }}>{p.body}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              <span>▲ {p.upvotes}</span>
              <span style={{ marginLeft: 12 }}>💬 {p.num_comments}</span>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

```

- I reviewed the repository rules to ensure we follow structure and conventions, then created the dataset, types, loader, API, and UI. I ran lint and committed everything in one atomic commit.

### Objective and deliverables
- Goal: Load realistic Reddit mock data and serve it as typed objects.
- Deliverables:
  - data/reddit-mock.json (~100 posts)
  - Type definitions
  - Data loading functions
  - (Plus) API route and feed UI per project standards

### What I implemented
- Data
  - Added `data/reddit-mock.json` with 100 realistic mock posts.

- Types
  - Added `src/types/reddit.ts` with `RedditPost` interface.

- Library
  - Added `src/lib/reddit-source.ts`:
    - `loadRedditPosts(): Promise<RedditPost[]>` reads and lightly validates JSON.
    - `pickRandomPosts(posts, count)` returns a random sample without replacement.

- Backend
  - Added API route `src/app/api/reddit/route.ts`:
    - GET returns `{ posts }` JSON.
    - Supports `?count=` (1..100).
    - Sets reasonable cache headers.
    - Static-friendly export.

- Frontend
  - Updated `src/app/feed/page.tsx`:
    - Server-side fetch from `/api/reddit?count=20`.
    - Renders a clean list with subreddit, title, body, upvotes, and comments.

- Code style and structure
  - Followed Next.js App Router with TypeScript.
  - Absolute imports via `@/`.
  - Consistent naming (kebab-case files, camelCase for functions/vars).
  - No any types; strict mode respected.

- Lint and commit
  - Lint passed.
  - Committed changes in one coherent step:
    - feat(reddit): add mock dataset, types, data loader, API route, and feed UI

You can now run the app and visit `/feed` to see the mock Reddit posts rendered.

- data: `data/reddit-mock.json` created with 100 entries.
- types: `src/types/reddit.ts` defines `RedditPost`.
- backend: `src/app/api/reddit/route.ts` serves typed posts with optional `count`.
- logic: `src/lib/reddit-source.ts` loads and samples posts.
- UI: `src/app/feed/page.tsx` fetches and renders posts.

---

**User**

Perform a complete, self-contained polish pass on all generated code to ensure it is **fully correct, consistent, and production-ready**.

### Objectives:

- Verify and complete all required logic, handlers, and integrations based on the task and context.
- Fix syntax, imports, typing, and async logic issues.
- Remove unused or temporary code, logs, and placeholders.
- Ensure consistent structure, naming, formatting, and error handling.
- Validate architecture alignment and adjust file/function placement if necessary.
- Refactor or simplify where appropriate **without changing functionality**.

Apply all corrections and improvements directly — output **only the finalized, clean code**.

---

**Cursor**

I'll refactor the feed page to load data from the library directly in a server component and add robust error handling to the API route. Then I'll run lint and commit the polish as a single commit.

```typescriptreact
import type { RedditPost } from '@/types/reddit';
import { loadRedditPosts, pickRandomPosts } from '@/lib/reddit-source';

export const revalidate = 300;

export default async function FeedPage() {
  const allPosts: RedditPost[] = await loadRedditPosts();
  const posts = pickRandomPosts(allPosts, 20);
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Feed</h1>
      <ul style={{ display: 'grid', gap: 12, listStyle: 'none', padding: 0 }}>
        {posts.map((p) => (
          <li
            key={p.id}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 16,
              background: '#fff'
            }}
          >
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{p.subreddit}</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>{p.title}</div>
            <div style={{ fontSize: 14, color: '#374151', marginBottom: 10 }}>{p.body}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              <span>▲ {p.upvotes}</span>
              <span style={{ marginLeft: 12 }}>💬 {p.num_comments}</span>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

```

```typescript
import { NextResponse } from 'next/server';
import { loadRedditPosts, pickRandomPosts } from '@/lib/reddit-source';

export const dynamic = 'force-static';

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const countParam = url.searchParams.get('count');
    const count = countParam ? Math.max(1, Math.min(100, Number(countParam))) : 20;

    const allPosts = await loadRedditPosts();
    const posts = pickRandomPosts(allPosts, Number.isFinite(count) ? count : 20);

    return NextResponse.json(
      { posts },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}



```

- Refactored `src/app/feed/page.tsx` to load from `@/lib/reddit-source` in a server component and added `revalidate = 300` for consistent caching.
- Hardened `src/app/api/reddit/route.ts` with try/catch and safer count parsing; returns 500 on unexpected failures.
- Removed fragile env-based API fetch; ensured strict typing and clean imports. All lint checks pass and changes were committed atomically.

