CC=g++
LD=g++
CFLAGS=-c -O3

LIBDIR=lib
SRCDIR=src
OBJDIR=obj
BINDIR=bin

CFILES=$(wildcard $(SRCDIR)/*.cpp)
OFILES=$(patsubst $(SRCDIR)/%.cpp,$(OBJDIR)/%.o,$(CFILES))

SOOLD=$(BINDIR)/soold

$(SOOLD): $(OFILES) | $(BINDIR)
	$(CC) $(OFILES) $(LDFLAGS) -o $@

$(OBJDIR)/%.o: $(SRCDIR)/%.cpp | $(OBJDIR)
	$(LD) $(CFLAGS) $^ -o $@

$(OBJDIR):
	mkdir $@

$(BINDIR):
	mkdir $@

.PHONY: clean

clean:
	rm -rf $(OBJDIR)
	rm -rf $(BINDIR)
