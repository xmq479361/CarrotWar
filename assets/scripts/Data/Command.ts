import { _decorator, Component, Node } from "cc";
const { ccclass, property } = _decorator;

@ccclass("Command")
export class Command extends Component {
  start() {}

  update(deltaTime: number) {}
}
