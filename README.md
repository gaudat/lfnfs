# lfnfs
FUSE driver supporting really long file names written in NodeJS.

This is a thin wrapper that transforms file names over 256 bytes long to a 32 hexadecimal digits long hashed representation with XXHash. 
The mapping from long filenames is saved in a text file for now. Using a SQLite database as a lookup table is planned but not implemented yet.

### Usage
Set `user_allow_others` to true in `fuse.conf` if processes run by other users need to access the filesystem.

`node index.js [origin_folder] [mount_point]`
This FUSE-mounts `origin_folder` on `mount_point`. The script stays on foreground since FUSE debug is turned on for now. Ctrl-C should unmount the FUSE filesystem.

If errors like "Software endpoint not connected" appears, the FUSE file system may not be cleanly unmounted. Use `fusermount -u [mount_point]` to unmount it in this case.

### Why?
Thanks to Linux and its (backwards IMO) 256 byte limit on file names. Some files created on Windows, especially those with multi-byte Unicode characters, cannot be accessed. 

### Features
* open, read, write, close
* stat, chmod, chown
* create, delete
* truncate
* statfs, returning a soft file name length limit of 1000000 bytes

### Features not implemented for now
* Returning long file names in directory listing
* Disk space usage
* Extended attributes
