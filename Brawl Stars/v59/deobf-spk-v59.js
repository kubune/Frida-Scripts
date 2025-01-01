// https://github.com/DemirCnq/Key-Deobfuscator

const module = Process.findModuleByName("libg.so");
const base = module.base;
Memory.protect(base, module.size, "rwx");

const decrypt_key_addr = base.add(0x3CE9D8); // deobf function offset

let decrypt_key = new NativeFunction(decrypt_key_addr, "uint", ["pointer"]);

function reverse_hex(hex_string) {
    if (hex_string.length % 2 !== 0) {
        hex_string = '0' + hex_string;
    }
    let byte_array = [];
    for (let i = 0; i < hex_string.length; i += 2) {
        byte_array.push(parseInt(hex_string.substr(i, 2), 16));
    }
    
    byte_array.reverse();
    let reversed_hex = byte_array.map(byte => {
        let hex = byte.toString(16).toUpperCase();
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
    
    return reversed_hex;
}


let key = "47FF1E97C3C79C5B26AACF464EC7034B4CE4FFAD21BA29F25D0C7C65BE244E7E32E0BA1D6C65F0679C9C48E155BA02D577FED286D314E70206770663DE9773ACDCE07397161506779753E7141054D2FE67C002BA40EC489CAF52F06555A7BAE013FD4E240AA67C0CFBAF29BA1DE8FFE4885703C74EB4CFAABA349CC73AFA"; // key
for(let i = 0; i < 32; i+=4){
    key += reverse_hex(decrypt_key(ptr(i)).toString(16));
}

console.log("THE KEY: " + key);
