#!/usr/bin/env python2
import os
import subprocess
import threading

# WORK_DIR = 'work'

# def checkOutput(s):
#   if 'Segmentation fault' in s or 'error' in s.lower() or :
#     return False
#   else:
#     return True

# corpus_dir = os.path.join(WORK_DIR, 'corpus')
# corpus_filenames = os.listdir(corpus_dir)

# for f in corpus_filenames:
#   testcase_path = os.path.join(corpus_dir, f)
#   cmd = ['bin/asan/pdfium_test', testcase_path]
#   process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
#                              stderr=subprocess.STDOUT)
#   output = process.communicate()[0]
#   if not checkOutput(output):
#     print testcase_path
#     print output
#     print '-' * 80

THREAD_NUM = 6

def writeout(s, filepath):
  if 'AddressSanitizer' in s:
    pass
  if 'Segmentation fault' in s:
    pass
  if 'error' in s.lower() :
    pass

def fuzzthread(tnum, files):
  # for file in files:
  #   print tnum, file
  print "hello"

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
    print testcase_path
  groups.append(litg)

tid = 0
for item in groups:
  print item
  t = threading.Thread(target=fuzzthread, args=(tid, item))
  t.start()
  tid = tid + 1
  