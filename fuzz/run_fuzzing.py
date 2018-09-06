#!/usr/bin/env python2
import os
import subprocess
import threading
import shutil

THREAD_NUM = 6

vuldir = os.path.join("vul")
segdir = os.path.join("seg")
errdir = os.path.join("err")

if not os.path.exists(vuldir) :
  os.makedirs(vuldir)
  vuldir = os.path.abspath(vuldir)
else :
  vuldir = os.path.abspath(os.path.join("vul"))

if not os.path.exists(segdir) :
  os.makedirs(segdir)
  segdir = os.path.abspath(segdir)
else :
  segdir = os.path.abspath(os.path.join("seg"))

if not os.path.exists(errdir) :
  os.makedirs(errdir)
  errdir = os.path.abspath(errdir)
else :
  errdir = os.path.abspath(os.path.join("err"))

def writeout(s, filepath):
  if 'AddressSanitizer' in s:
    print "vul %s" %filepath
    shutil.move(filepath, vuldir)
  elif 'Segmentation fault' in s:
    print "seg %s" %filepath
    shutil.move(filepath, segdir)
  elif 'error' in s.lower() :
    print "err %s" %filepath
    shutil.move(filepath, errdir)

def fuzzthread(tnum, files):
  for file in files:
    print "thread %d use %s" %(tnum, file)
    f = open(file, "r")
    arg = f.read()
    f.close()
    cmd = ["/Users/ssd/develop/Frida-Scripts/fuzz/test", arg]
    process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                           stderr=subprocess.STDOUT)
    pid = process.pid
    output = process.communicate()[0]
    writeout(output, file)


testfiles = os.listdir(os.path.join("fuzztest"))

if len(testfiles) < THREAD_NUM:
  THREAD_NUM = len(testfiles)

itemlen = len(testfiles) / THREAD_NUM
groups = []

folder = os.path.join("fuzztest")

for i in range(0, THREAD_NUM) :
  litg = []
  for j in range(0, itemlen) :
    itemindex = i * itemlen + j
    testcase_path = os.path.abspath(os.path.join(folder, testfiles[itemindex]))
    litg.append(testcase_path)
  groups.append(litg)

if len(testfiles) % THREAD_NUM != 0 :
  litg = []
  statrtindex = len(testfiles) - (len(testfiles) % THREAD_NUM)
  for i in range(statrtindex, len(testfiles)) :
    testcase_path = os.path.abspath(os.path.join(folder, testfiles[i]))
    litg.append(testcase_path)
  groups.append(litg)

tid = 0
for item in groups:
  t = threading.Thread(target=fuzzthread, args=(tid, item))
  t.start()
  tid = tid + 1
  