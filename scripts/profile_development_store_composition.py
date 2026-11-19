"""Hồ sơ các store development (loại lockbox) để cấu hình store case study RQ4.
In ra: tỉ lệ store có từng dịch vụ bên thứ ba, và thành phần trang trung vị theo loại trang.
Chỉ xem *thành phần* trang (request, dung lượng, DOM) — không dùng để chọn store theo LCP/TBT.
Dùng: npm run rq4:profile-stores
"""
import csv, gzip, json, hashlib, statistics, collections, os
from pathlib import Path

ROOT = str(Path(__file__).resolve().parents[1])
rows = [r for r in csv.DictReader(open(os.path.join(ROOT, "data/processed/dataset-v1.0.csv")))
        if r["site_type"] == "shopify_storefront" and r["status"] == "ok"]


def in_lockbox(site):
    """Luật lockbox của protocol: sha1("lockbox:" + site) mod 5 == 0."""
    return int(hashlib.sha1(("lockbox:" + site).encode()).hexdigest()[:8], 16) % 5 == 0


rows = [r for r in rows if not in_lockbox(r["site"])]
sites = sorted({r["site"] for r in rows})
print(f"development stores: {len(sites)}, valid measurements: {len(rows)}")

# dịch vụ bên thứ ba: một lần đo hợp lệ đầu tiên mỗi trang là đủ để biết có hay không
entity_sites = collections.defaultdict(set)
entity_cat = {}
seen_pages = set()
for r in rows:
    key = (r["site"], r["page_type"])
    if key in seen_pages:
        continue
    seen_pages.add(key)
    try:
        lhr = json.load(gzip.open(os.path.join(ROOT, r["raw_path"], "lhr.json.gz")))
    except Exception as e:  # thiếu artifact: bỏ trang này, in ra để biết
        print("skip", r["measurement_id"], e)
        continue
    ents = {e.get("name"): e for e in lhr.get("entities", []) or []}
    items = (lhr["audits"].get("third-party-summary", {}).get("details") or {}).get("items", [])
    for it in items:
        name = it["entity"] if isinstance(it["entity"], str) else it["entity"].get("text")
        if not name or "Shopify" in name:
            continue
        entity_sites[name].add(r["site"])
        cat = (ents.get(name) or {}).get("category")
        if cat:
            entity_cat[name] = cat

print("\nTop third-party entities (share of development stores):")
for name, s in sorted(entity_sites.items(), key=lambda kv: -len(kv[1]))[:30]:
    print(f"  {len(s)/len(sites):5.0%}  {name}  [{entity_cat.get(name, '?')}]")

cats = collections.defaultdict(set)
for name, s in entity_sites.items():
    cats[entity_cat.get(name, "unknown")] |= s
print("\nThird-party categories (share of stores with >=1 entity):")
for c, s in sorted(cats.items(), key=lambda kv: -len(kv[1])):
    print(f"  {len(s)/len(sites):5.0%}  {c}")

print("\nMedian page composition (median of page medians):")
cols = ["third_party_requests", "third_party_bytes", "script_requests", "script_bytes", "image_bytes",
        "lcp_resource_bytes", "stylesheet_bytes", "dom_elements", "request_count", "transfer_bytes_total",
        "render_blocking_count", "lh_lcp_ms", "tbt_30s_ms"]
for pt in ("home", "product"):
    pages = collections.defaultdict(list)
    for r in rows:
        if r["page_type"] == pt:
            pages[r["site"]].append(r)
    print(f"  [{pt}] pages={len(pages)}")
    for c in cols:
        vals = []
        for rs in pages.values():
            v = [float(x[c]) for x in rs if x[c] not in ("", "NA", "nan")]
            if v:
                vals.append(statistics.median(v))
        q = statistics.quantiles(vals, n=4)
        print(f"    {c:24s} median={statistics.median(vals):>12,.0f}  IQR={q[0]:,.0f}-{q[2]:,.0f}")
    lazy = [statistics.median([float(x['lcp_lazy_loaded'] or 0) for x in rs]) for rs in pages.values()]
    img = [statistics.median([float(x['lcp_has_resource'] or 0) for x in rs]) for rs in pages.values()]
    print(f"    LCP is an image: {sum(v >= .5 for v in img)/len(img):.0%}; LCP image lazy-loaded: {sum(v >= .5 for v in lazy)/len(lazy):.0%}")
