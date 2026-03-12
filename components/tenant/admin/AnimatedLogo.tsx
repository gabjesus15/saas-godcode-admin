import { useEffect, useState } from "react";

export function AnimatedLogo() {
  const [letters, setLetters] = useState("Gcode");
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    // Solo animar si se activa desde fuera (ejemplo: login)
    // Aquí animamos al montar el componente
    setAnimating(true);
    let current = "";
    const godCode = "GodCode";
    let i = 0;
    const interval = setInterval(() => {
      if (i < godCode.length) {
        current += godCode[i];
        setLetters(current);
        i++;
      } else {
        clearInterval(interval);
        setAnimating(false);
      }
    }, 120);
    return () => clearInterval(interval);
  }, []);

  return (
    <span style={{fontFamily:'Nevis, sans-serif', fontSize:'2.2rem', color:'#14D9D9', fontWeight:'bold', letterSpacing:'-2px'}}>
      {letters}
      {animating && letters.length < 7 ? <span style={{color:'#888'}}>|</span> : null}
    </span>
  );
}
