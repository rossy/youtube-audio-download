CPP = cpp
CPPFLAGS = -P -C -x c -w -undef -nostdinc -std=c99 -fdollars-in-identifiers -MD -MP -iquote src -iquote .
RM = rm -f

all: youtube-audio-download.user.js
.PHONY: all

-include *.d

youtube-audio-download.user.js: src/youtube-audio-download.js
	$(CPP) $(CPPFLAGS) -MT $@ $< -o $@

clean:
	-$(RM) youtube-audio-download.user.d youtube-audio-download.user.js
.PHONY: clean
