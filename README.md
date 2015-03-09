# Javascriptで日本地図を表示する。

> これを伊能忠敬に捧げます。

パブリックドメインの日本地図データと、Datamaps.jsの日本版。

ファイル説明

* japan.geojson ・・・ GeoJson形式の日本地図（パブリックドメイン）
* japan.topojson ・・・ TopoJson形式の日本地図（パブリックドメイン・圧縮なし）
* japan_sXX.topojson ・・・ TopoJson形式の日本地図（パブリックドメイン・XX％に圧縮）
* datamaps.japan.js ・・・ Datamaps.usa.jsを少し改造して日本地図（8%に圧縮した地図）を表示するようにした。
* datamaps.japan.min.js ・・・ datamaps.japan.jsのminify版



## japan.geojson

[1:10m Cultural Vectors -  Natural Earth](http://www.naturalearthdata.com/downloads/10m-cultural-vectors/)からダウンロードした地図をGeoJsonに変換し、以下のように加工した。

1. 都道府県のコード（ISO 3166-2）を設定。
2. 静岡県のname_localがnullになっていたのを"静岡県"に設定。
3. 佐賀と長崎のregionがnullになっていたのを"Kyusyu"に設定。
4. 都道府県コード順でデータを並べ替えた。データをテキストで見た時に見やすくし
   ただけで、地図の表示には影響ない。
5. JPN-99 (Japan minor island)を削除

このgithubにある地図データはすべてパブリックドメインです。


## japan.topojson, japan_sXX.topojson

japan.geojsonをTopoJson形式に変換したもの。

ファイル名がjapan_sXXとなっているものは、[mapshaper](http://www.mapshaper.org/)でXX%にシンプル化している。


## datamaps.japan.js, datamaps.japan.min.js

[Datamaps](http://datamaps.github.io/)のdatamaps.usa.jsを日本版に変えたもの。
地図データは、japan_s8.topojson（8%にシンプル化された地図）を使用している。
ライセンスはMIT。
