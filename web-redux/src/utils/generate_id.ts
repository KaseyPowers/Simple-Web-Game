import type { UUID } from "./types";

const isSecure = window.isSecureContext;
if (!isSecure) {
    console.warn("Not a secure context, won't use crypto lib");
}

export function generateUUID(existingIds?: UUID[]): UUID {

    if (isSecure) {
        const newID = crypto.randomUUID();
        /** Make sure id isn't in this array already, don't think it should be possible */
        if (existingIds && existingIds.includes(newID)) {
            throw new Error("crypto generated an ID that already exists? that shouldn't happen");
        }
        return newID;
    } else if (existingIds) {
        /** 
         * If not secure, doing a simple number as an id
         * Note we could also do Math.Random type number generation for fancier looking IDs if we want
          */

        const isNewID = (val: UUID): boolean => {
            return existingIds?.includes(val) ?? false;
        }
        /** default to using length of array of number, should only already be defined if id was added and another value removed  */
        if (isNewID(`${existingIds.length}`)) {
            return `${existingIds.length}`;
        }
        /** If length didn't work, just find first unused number */
        let numID = 0;
        while (!isNewID(`${numID}`)) {
            numID++;
        }
        // should now have numID that is first unused number
        return `${numID}`;
    } else {
        /** Without existing IDs to compare against, just do a math.random to approximate the crypto format. not secure if doing real stuff */
        const random4Digits = () => Math.floor(Math.random() * 10000);
        return Array(5).map(() => random4Digits()).join("-");
    }
}