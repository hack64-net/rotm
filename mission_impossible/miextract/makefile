CC=gcc
LD=gcc
CFLAGS=-c -O3
LDFLAGS=-L$(LIBDIR) -lz

LIBDIR=lib
SRCDIR=src
OBJDIR=obj
BINDIR=bin

DUMPDIR=midata
ROM=mi.z64

CFILES=$(wildcard $(SRCDIR)/*.c)
OFILES=$(patsubst $(SRCDIR)/%.c,$(OBJDIR)/%.o,$(CFILES))

MIEXTRACT=$(BINDIR)/miextract

$(MIEXTRACT): $(OFILES) | $(BINDIR)
	$(CC) $(OFILES) $(LDFLAGS) -o $@

$(OBJDIR)/%.o: $(SRCDIR)/%.c | $(OBJDIR)
	$(LD) $(CFLAGS) $^ -o $@

$(OBJDIR):
	mkdir $@

$(BINDIR):
	mkdir $@

dump: $(MIEXTRACT) $(ROM)
	$(MIEXTRACT) $(ROM) $(DUMPDIR)

.PHONY: clean dump

clean:
	rm -rf $(OBJDIR)
	rm -rf $(BINDIR)
	rm -rf $(DUMPDIR)
