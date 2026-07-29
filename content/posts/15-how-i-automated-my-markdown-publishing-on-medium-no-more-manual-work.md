---
title: "How I Automated My Markdown Publishing on Medium (No More Manual Work!)"
date: 2025-04-26T18:30:13+05:30
summary: "Tired of manually reformatting Markdown for Medium? Discover my open-source tool that converts Hugo-friendly Markdown into perfectly formatted Medium posts instantly."
tags:
  - markdown
  - medium
  - blogging
  - hugo
  - content-creation
categories:
  - developer-tools
  - writing-tips
featureimage: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2400&auto=format&fit=crop"
featureimagecaption: "Photo by [Robert Lukeman](https://unsplash.com/@robertlukeman) on [Unsplash](https://unsplash.com/photos/_RBbnujcCrY)"
showHero: true
heroStyle: "background"
imagePosition: "center"
---

---

## [🚀 Launch Markdown2Medium Converter](https://markdown2medium.vercel.app)

---

### **The Problem: Writing Once, Publishing Twice**  

As a technical writer, I love using **Markdown** for my blog posts. My current setup involves:  

- Writing in Markdown  
- Publishing to my **Hugo** static site  
- As well as sharing on **Medium** for broader reach

But here's the catch: **Medium doesn’t natively support Markdown.** Every time I wanted to cross-post, I had to:  

1. Copy my Markdown content  
2. Manually reformat it in Medium’s editor  
3. Fix broken code blocks, images, and headings  

This was **time-consuming** and **error-prone**. I needed a better way.  

---

### **The Solution: A Markdown-to-Medium Converter**  

I built a **simple web tool** that:  
✅ Converts Markdown to **Medium-friendly Content**  
✅ Preserves **code blocks, images, and formatting**  
✅ Provides a **live preview** before publishing  
✅ Lets me **copy content**  

Now, my workflow is seamless:  

1. Write in Markdown (as usual)  
2. Paste into my **converter tool**  
3. Copy the content → Paste into Medium  

No more manual tweaks!  

#### **Try It Yourself**  

> **_<https://markdown2medium.vercel.app/>_**

You can find the tool here: [GitHub Repo](https://github.com/Joel-hanson/markdown2medium)

---

### **How It Works**  

The tool uses:  

- **`marked.js`** for Markdown parsing  
- **DOM manipulation** to add Medium’s required CSS classes  
- **Clipboard API** for easy copying  

Example:  

```markdown
# My Post  
This is **bold** text.  

```python  
print("Hello, Medium!")  
```_

```

Gets converted to:  

```html
<h1 class="graf graf--h1">My Post</h1>  
<p class="graf graf--p">This is <strong class="markup--strong markup--p-strong">bold</strong> text.</p>  
<pre class="graf graf--pre"><code class="markup--code markup--pre-code">print("Hello, Medium!")</code></pre>  
```  

---

### **Future Plans: Automation with GitHub Actions**  

**Next step:** A **GitHub Action** that:  

1. Watches for new Markdown posts in my Hugo blog  
2. **Auto-converts** them to Medium-ready Content  
3. **Publishes directly** via Medium’s API  

This would make cross-posting **completely hands-off!**  

---

### **Final Thoughts**  

If you’re a **Markdown writer** who also publishes on Medium, this tool can **save you hours**. No more manual reformatting—just **write once, publish everywhere.**  

🔗 **Try it out & contribute:** [GitHub Repo](https://github.com/Joel-hanson/markdown2medium)

---

_For more Kafka Connect tips and open-source tools, follow the [blog series](https://joel-hanson.github.io/posts/)_
