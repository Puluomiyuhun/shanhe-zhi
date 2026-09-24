# 沿海地理背景

数据：Natural Earth 1:50m land，公共领域（Public Domain）。
原始数据：https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_land.geojson
说明：https://www.naturalearthdata.com/downloads/50m-physical-vectors/50m-land/
许可：https://www.naturalearthdata.com/about/terms-of-use/

2026-09-24 下载；裁剪至 95–135°E、18–48°N，保留面积大于 0.06 平方度的外环，以 0.045° 容差概化，共 11 环、577 顶点。只用于陆海形状，不提供现代行政疆界。保留海南、台湾及邻近大陆海岸。西北裁切边延至视域外，避免人为画成岛屿。

各剧本 coast.projectionX / projectionZ 是分段线性沙盘映射，offset 用于兼容已有区域布局。这不是等距投影，也不是精确古海岸复原；不能由游戏世界坐标反推出历史城址经纬度。春秋沿用现有古河道概化数据，并未将现代黄河河口覆盖进去。渤海、黄海、东海、南海采用便于辨识的通用地理名称。

新增区域主要是地理背景：无新增城市、人物、势力、全国行军格子或航海系统。可玩范围外不接受移动指令。未来全国剧本应重新统一地理投影与历史城址数据，不能把当前压缩布局视为全国比例尺。
