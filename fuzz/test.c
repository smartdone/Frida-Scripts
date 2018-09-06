#include <stdio.h>
#include <string.h>

void vul(char *s) {
	char buff[10];
	strcpy(buff, s);
	printf("%s\n", buff);
}

int main(int argc, char *argv[]) {
	if(argc < 2)
		return 0;
	vul(argv[1]);	
}

