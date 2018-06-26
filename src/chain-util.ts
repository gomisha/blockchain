const EC = require("elliptic").ec;
import * as uuidV1 from "uuid/v1";

const ec = new EC('secp256k1');

export default class ChainUtil {
    static genKeyPair() {
        return ec.genKeyPair();
    }

    static genID(): string {
        return uuidV1();
    }
}