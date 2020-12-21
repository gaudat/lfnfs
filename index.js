const Fuse = require('fuse-native');
const xx = require('xxhashjs');
const fs = require('fs');
const process = require('process');
const api_path = require('path');

console.log(process.argv);
const src_dir = process.argv[2];
const mount_dir = process.argv[3];
// argv[0] = node, argv[1] = js, argv[2] = src_dir, argv[3] = mount_dir

const allow_other = true;
const debug = true;
const fn_length_limit = 250;

let shorten_fn_if_too_long = (fn) => {
    if (Buffer.from(fn).byteLength <= fn_length_limit) return fn;
    let hn = xx.h64(fn, 0).toString(16);
    //console.log("Shortened name",fn,"to",hn);
    fs.writeFileSync("./lfn_lut",hn+"/"+fn+"\n",{flag: "a"});
    return hn;
}
// Transform path from src to dst
let x = (path) => {
    // path = path relative to mount_dir
    // return = real path
    // Check for any part of this path having a name thats too long
    path = api_path.normalize(path);
    path = path.split(api_path.sep);
    path = path.map(shorten_fn_if_too_long);
    console.log(path);
    return api_path.join(src_dir, ...path);
};

const ops = {
    statfs: (path, cb) => {
        cb(0, {namemax: 1000000});
    },
    getattr: (path, cb) => {
        fs.stat(x(path), (err, stat) => {
            if (err !== null) return cb(err.errno);
            return cb(0,stat);
        })
    },
    readdir: (path, cb) => {
        fs.readdir(x(path), (err, ls) => {
            if (err !== null) return cb(err.errno);
            return cb(0, ls);
        })},
  /*
  access: function (path, cb) {
    return process.nextTick(cb, 0)
  },
  */
    open: (path, flags, cb) => {
        fs.open(x(path), flags, (err, fd) => {
            if (err !== null) return cb(err.errno);
            return cb(0, fd);
        })},
    release: (path, fd, cb) => {
        fs.close(fd, err => {
            if (err !== null) {
            return cb(err.errno);
            } else return cb(0);
        })},
    read: (path, fd, buf, len, pos, cb) => {
        console.log(len, pos);
        fs.read(fd, buf, 0, len, pos, (err, bytesRead, buf) => {cb(bytesRead)})},
    write: (path, fd, buf, len, pos, cb) => {
        fs.write(fd, buf, 0, len, pos, (err, bytesWritten, buf) => {cb(bytesWritten)})},
    create: (path, mode, cb) => {
        fs.open(x(path), "a", mode, (err, fd) => {
            if (err !== null) {return cb(err.errno);} else {return cb(0, fd);}})},
    unlink: (path, cb) => {
        fs.unlink(x(path), err => {
            if (err !== null) {return cb(err.errno)} else {return cb(0)}
        })},
    mkdir: (path, mode, cb) => {
        fs.mkdir(x(path), {mode: mode}, err => {
            if (err !== null) {
                return cb(err.errno);
            } else {
                return cb(0);
            }
        })},
    rmdir: (path, cb) => {
        fs.rmdir(x(path), err => {
            if (err !== null) {
                return cb(err.errno);
            } else {
                return cb(0);
            }
        })},
    rename: (src, dest, cb) => {
        fs.rename(x(src), x(dest), err => {
            if (err !== null) {
                return cb(err.errno);
            } else {
                return cb(0);
            }
        })},
    utimens: (path, atime, mtime, cb) => {
        atime = atime / 1000;
        mtime = mtime / 1000;
        fs.utimes(x(path), atime, mtime, err => {
            if (err !== null) {
                return cb(err.errno);
            } else {
                return cb(0);
            }
        })},
    chown: (path, uid, gid, cb) => {
        fs.chown(x(path), uid, gid, err => {
            if (err !== null) {
                return cb(err.errno);
            } else {
                return cb(0);
            }
        })},
    chmod: (path, mode, cb) => {
        fs.chmod(x(path), mode, err => {
            if (err !== null) {
                return cb(err.errno);
            } else {
                return cb(0);
            }
        })},
    truncate: (path, size, cb) => {
        fs.truncate(x(path), size, err => {
            if (err !== null) {
                return cb(err.errno);
            } else {
                return cb(0);
            }
        })},

}

const fuse = new Fuse(mount_dir, ops, { debug: debug, displayFolder: true, allowOther: allow_other })
fuse.mount(err => {
  if (err) throw err
  console.log('filesystem mounted on ' + fuse.mnt)
})

process.once('SIGINT', function () {
  fuse.unmount(err => {
    if (err) {
      console.log('filesystem at ' + fuse.mnt + ' not unmounted', err)
    } else {
      console.log('filesystem at ' + fuse.mnt + ' unmounted')
    }
  })
})
