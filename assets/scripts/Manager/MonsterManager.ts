import { instantiate, Node, NodePool, Prefab } from "cc";

export class MonsterManager {
  static _Instance: MonsterManager = null;

  static get Instance() {
    if (MonsterManager._Instance == null) {
      console.log("MonsterManager init: ");
      MonsterManager._Instance = new MonsterManager();
    }
    return MonsterManager._Instance;
  }

  monsterPool: NodePool = new NodePool();

  newMonster(monsterPrefab: Prefab) {
    let monster = this.monsterPool.get();
    if (!monster) {
      console.log("monster is null");
      return instantiate(monsterPrefab);
    }
    console.log("monster from pool: ", this.monsterPool.size());
    return monster;
  }
  recycleMonster(monster: Node) {
    this.monsterPool.put(monster);
  }
}
