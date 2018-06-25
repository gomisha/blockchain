const EC = require("elliptic").ec;
const ec = new EC('secp256k1');

//import * as EC from "elliptic";

export default class ChainUtil {
    static genKeyPair() {
        return ec.genKeyPair();
    }
}