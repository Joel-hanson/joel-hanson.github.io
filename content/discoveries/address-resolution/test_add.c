#include <stdio.h>
#include <arpa/inet.h>

int main() {
		const char *short_ip = "1.0";
		struct in_addr address;

		if (inet_aton(short_ip, &address)) {
				printf("Expanded address %s", inet_ntoa(address));
		}
		return 0;
}
