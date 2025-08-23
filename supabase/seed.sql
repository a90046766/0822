insert into products (id,name,unit_price,group_price,group_min_qty,description,image_urls,safe_stock)
values
 ('P-AC-CLEAN','分離式冷氣清洗',1800,1600,2,'室內外機標準清洗','[]',20),
 ('P-WASH-CLEAN','洗衣機清洗（滾筒）',1999,1799,2,'滾筒式清洗','[]',20),
 ('P-HOOD-T','倒T型抽油煙機清洗',2200,2000,2,'倒T型清洗','[]',20),
 ('P-HOOD-TRAD','傳統雙渦輪抽油煙機清洗',1800,1600,2,'傳統型清洗','[]',20)
on conflict (id) do nothing;


