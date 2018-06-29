const EC = require("elliptic").ec;
import * as crypto from "crypto-js";
import * as uuidV1 from "uuid/v1";

const ec = new EC('secp256k1');

export default class ChainUtil {
    static genKeyPair() {
        return ec.genKeyPair();
    }

    /**
     * Generates hash based on any given data. Useful for not having to sign very large pieces of data but
     * just the hash value.
     * @param data Any arbitrary data with no fixed size that will be hashed to a set size.
     */
    static genHash(data: any): string {
        return crypto.SHA256(JSON.stringify(data)).toString();
    }

    static genID(): string {
        return uuidV1();
    }

    /**
     * 
     * @param publicKey Key to use for the verification.
     * @param signature Signature to verify.
     * @param expectedDataHash Expected hash if signature is successfully verified.
     */
    static verifySignature(publicKey: string, signature: string, expectedDataHash: string): boolean {
        try {
            return ec.keyFromPublic(publicKey, 'hex').verify(expectedDataHash, signature);
        }
        catch(Error) {
            console.log("signature verification error for public key: " + publicKey + "; error message: " + Error.message);
            return false;
        }
    }
}