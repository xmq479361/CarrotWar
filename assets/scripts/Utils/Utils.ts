import { resources, JsonAsset } from "cc";

export class Utils {
  /**
   * 加载本地JSON配置文件的工具函数
   * @param jsonFilePath 相对于assets/resources的路径（不含后缀名）
   * @param callback 加载完成后的回调函数
   */
  static loadLocalJson<T>(
    jsonFilePath: string,
    callback: (data: T | null) => void
  ) {
    console.warn("loadLocalJson:", jsonFilePath);
    // 使用Cocos的资源管理系统加载（注意自动关联.meta文件[<sup>1</sup>](https://www.cnblogs.com/ybgame/p/14260152.html)）
    resources.load(jsonFilePath, (error: Error, asset: any) => {
      if (error) {
        console.error(`JSON加载失败: ${jsonFilePath}`, error);
        callback(null);
        return;
      }

      // 验证资源类型(基于.meta识别的类型[<sup>1</sup>](https://www.cnblogs.com/ybgame/p/14260152.html))
      if (asset instanceof JsonAsset) {
        console.warn("loadLocalJson result:", asset.json);
        callback(asset.json as T);
      } else {
        console.warn("非JSON资源类型:", asset);
        callback(null);
      }
    });
  }
}
