import { Box, Image, Text, ThemeProvider } from '@chakra-ui/core';
import { differenceInSeconds, endOfDay, isFuture, startOfHour } from 'date-fns';
import parser from 'epg-parser';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import './App.css';
import customTheme from './theme';

const now = new Date();
const offset = startOfHour(now).getTime() / 1000;
const endEpoch = endOfDay(now).getTime() / 1000;
console.log('TCL: App:React.FC -> offset', offset);

const Container = (props: any) => (
  <Box flex={1} pt={10} pb={10} pl={10} position='absolute'>
    {props.children}
  </Box>
);

const ChannelNumber = (props: any) => (
  <Box
    width='75px'
    backgroundColor='hsla(0,0%,100%,.1)'
    height='75px'
    display='flex'
    alignItems='center'
    justifyContent='center'
    mr='2px'
  >
    <Text color='#fafafa' fontSize='xl'>
      {props.number}
    </Text>
  </Box>
);

const ChannelLogo = (props: any) => (
  <Box
    width='150px'
    backgroundColor='hsla(0,0%,100%,.3)'
    height='75px'
    display='flex'
    alignItems='center'
    justifyContent='center'
    mr='2px'
  >
    {props.icon ? (
      <Image src={props.icon} width='75%' height='80%' />
    ) : (
      <Text color='#fafafa' fontSize='xl'>
        {props.name}
      </Text>
    )}
  </Box>
);

const ShowSlot = (props: any) => {
  let duration = props.program.duration;
  if (props.index === 0) {
    duration = props.program.endDate - offset;
  }
  const size = duration / 10;

  return (
    <Box
      width={size + 'px'}
      backgroundColor={props.index === 0 ? `hsla(0,0%,100%,.2)` : `hsla(0,0%,100%,.05)`}
      height='75px'
      mr='2px'
      pl='10px'
      pr='10px'
    >
      <Text fontWeight='bold' color='#fafafa' fontSize='md' isTruncated>
        {props.program.title[0].value + ' (' + props.program.duration / 60 + ') mins'}
      </Text>
      <Text color='#fafafa' fontSize='xs' isTruncated>
        {props.program.desc[0].value}
      </Text>
      {/* <Text fontSize='xl'>TEST</Text> */}
    </Box>
  );
};

const ChannelRow = (props: any) => {
  return (
    <Box mb='2px' flex={1} height='75px' flexDirection='row' display='flex'>
      <ChannelNumber number={props.number} />
      <ChannelLogo name={props.name} icon={props.icon} />
    </Box>
  );
};

const ProgramRow = (props: any) => {
  return (
    <Box mb='2px' flex={1} height='75px' flexDirection='row' display='flex'>
      {!props.programs ||
        (props.programs.length === 0 && (
          <ShowSlot
            key={props.number + 0}
            index={0}
            program={{
              endDate: endEpoch,
              title: [{ value: 'NO DATA' }],
              duration: 9999999,
              desc: [{ value: 'NO DATA' }]
            }}
          />
        ))}
      {props.programs &&
        props.programs.map((program: any, index: number) => (
          <ShowSlot key={props.number + index} index={index} program={program} />
        ))}
    </Box>
  );
};

// Use at the root of your app
const App: React.FC = () => {
  const [guide, setGuide] = useState();

  function getDate(date: string) {
    // 20200119040000 +0000
    // '1995-12-17T03:24:00'
    return new Date(
      `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}T${date.substring(
        8,
        10
      )}:${date.substring(10, 12)}:${date.substring(12, 14)}.000Z`
    );
  }

  function groupChannels(guide: any) {
    const programs = _.groupBy(guide.programs, 'channel');
    return guide.channels.map((channel: any) => ({
      ...channel,
      programs: programs[channel.id]
        ? programs[channel.id]
            .map((program: any) => ({
              ...program,
              startDateObj: getDate(program.start),
              startDate: getDate(program.start).getTime() / 1000,
              endDateObj: getDate(program.stop),
              endDate: getDate(program.stop).getTime() / 1000,
              duration: differenceInSeconds(getDate(program.stop), getDate(program.start))
            }))
            .filter((program: any) => isFuture(program.endDateObj))
        : []
    }));
  }

  useEffect(() => {
    fetch('http://i.mjh.nz/za/DStv/epg.xml')
      .then(res => res.text())
      .then(epg => parser.parse(epg))
      .then(guide => groupChannels(guide))
      .then(guide => setGuide(guide));
  }, []);

  console.log('TCL: App:React.FC -> guide', guide);

  const width = document.documentElement.clientWidth - 300;
  // 1 min duration = 1 px display

  return (
    <ThemeProvider theme={customTheme}>
      <Container>
        <Box position='absolute' flex={1} flexDirection='column' display='flex'>
          {guide &&
            guide.map((channel: any) => (
              <ChannelRow
                key={channel.id}
                number={channel.id}
                name={channel.name}
                icon={channel.icon}
                programs={channel.programs}
              />
            ))}
        </Box>
        <Box
          width={width}
          overflowX='scroll'
          position='absolute'
          left={270}
          flex={1}
          flexDirection='column'
          display='flex'
        >
          {guide &&
            guide.map((channel: any) => (
              <ProgramRow
                key={channel.id}
                number={channel.id}
                name={channel.name}
                icon={channel.icon}
                programs={channel.programs}
              />
            ))}
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default App;
